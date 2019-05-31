import { Client as PGClient } from "pg";
import { MongoClient } from "mongodb";
import { createConnection, Connection } from "mysql";

import { DatabaseCredentials, EndpointDialog } from "./EndpointDialog";
import { omit } from "lodash";
import { Connectors } from "prisma-db-introspection";
import { DatabaseType } from "prisma-datamodel";
import { IConnector } from "prisma-db-introspection/dist/common/connector";
import { URL } from "url";

function replaceLocalDockerHost(credentials: DatabaseCredentials) {
  if (credentials.host) {
    const replaceMap = {
      "host.docker.internal": "localhost",
      "docker.for.mac.localhost": "localhost",
    };
    return {
      ...credentials,
      host: replaceMap[credentials.host] || credentials.host,
    };
  }
  return credentials;
}

export interface ConnectorAndDisconnect {
  /**
   * The introspection connector instance
   */
  connector: IConnector;
  /**
   * Callback to let the client disconnect
   */
  disconnect: () => Promise<void>;
}

/**
 * This data is needed to perform the introspection
 */
export interface ConnectorData extends ConnectorAndDisconnect {
  /**
   * The concrete database type used by the Connector that is included in this object
   */
  databaseType: DatabaseType;
  /**
   * The database name either directly provided by the user or chosen in the select schema dialog
   */
  databaseName: string;
}

/**
 * As we use a separate function to guarantee for the databaseName, it's optional ehre
 */
export interface IntermediateConnectorData extends ConnectorAndDisconnect {
  databaseType: DatabaseType;
  databaseName?: string;
  interactive: boolean;
}

export async function getConnectedConnectorFromCredentials(
  credentials: DatabaseCredentials,
): Promise<ConnectorAndDisconnect> {
  let client: MongoClient | PGClient | Connection;
  let disconnect: () => Promise<void>;

  switch (credentials.type) {
    case DatabaseType.mongo: {
      client = await getConnectedMongoClient(credentials);
      disconnect = () => (client as MongoClient).close();
      break;
    }
    case DatabaseType.mysql: {
      client = await getConnectedMysqlClient(credentials);
      disconnect = async () => (client as Connection).end();
      break;
    }
    case DatabaseType.postgres: {
      client = await getConnectedPostgresClient(credentials);
      disconnect = () => (client as PGClient).end();
      break;
    }
  }

  const connector = Connectors.create(credentials.type, client!);

  return { connector, disconnect: disconnect! };
}

export async function getConnectorWithDatabase(
  connectorData: IntermediateConnectorData,
  endpointDialog: EndpointDialog,
): Promise<ConnectorData> {
  const {
    connector,
    disconnect,
    databaseType,
    interactive,
    ...result
  } = connectorData;
  let { databaseName } = result;

  let schemas: string[];
  try {
    schemas = await connector!.listSchemas();
  } catch (e) {
    throw new Error(`Could not connect to database. ${e.message}`);
  }

  if (!databaseName && !interactive) {
    throw new Error(`Please provide a database name`);
  }

  if (databaseName && !schemas.includes(databaseName)) {
    const schemaWord =
      databaseType === DatabaseType.postgres ? "schema" : "database";

    throw new Error(
      `The provided ${schemaWord} "${databaseName}" does not exist. The following are available: ${schemas.join(
        ", ",
      )}`,
    );
  }

  if (!databaseName) {
    databaseName = await endpointDialog.selectSchema(schemas);
  }

  return { connector, disconnect, databaseType, databaseName };
}

async function getConnectedMysqlClient(
  credentials: DatabaseCredentials,
): Promise<Connection> {
  const credentialsWithoutSsl = omit<DatabaseCredentials, "ssl">(
    replaceLocalDockerHost(credentials),
    "ssl",
  );

  const client = createConnection(credentialsWithoutSsl);

  await new Promise((resolve, reject) => {
    client.connect(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  return client;
}

async function getConnectedPostgresClient(
  credentials: DatabaseCredentials,
): Promise<PGClient> {
  const sanitizedCredentials = replaceLocalDockerHost(credentials);
  const client = new PGClient(sanitizedCredentials);
  await client.connect();
  return client;
}

function getConnectedMongoClient(
  credentials: DatabaseCredentials,
): Promise<MongoClient> {
  return new Promise((resolve, reject) => {
    if (!credentials.uri) {
      throw new Error(`Please provide the MongoDB connection string`);
    }

    MongoClient.connect(
      credentials.uri,
      { useNewUrlParser: true },
      (err, client) => {
        if (err) {
          reject(err);
        } else {
          if (credentials.database) {
            client.db(credentials.database);
          }
          resolve(client);
        }
      },
    );
  });
}

export function sanitizeMongoUri(mongoUri: string) {
  const url = new URL(mongoUri);
  if (url.pathname === "/" || url.pathname.length === 0) {
    url.pathname = "admin";
  }

  return url.toString();
}

export function populateMongoDatabase({
  uri,
  database,
}: {
  uri: string;
  database?: string;
}): { uri: string; database: string } {
  const url = new URL(uri);
  if ((url.pathname === "/" || url.pathname.length === 0) && !database) {
    throw new Error(
      `Please provide a Mongo database in your connection string.\nRead more here https://docs.mongodb.com/manual/reference/connection-string/`,
    );
  }

  if (!database) {
    database = url.pathname.slice(1);
  }

  return {
    uri,
    database,
  };
}

export function hasAuthSource(uri: string): boolean {
  return new URL(uri).searchParams.has("authSource");
}

const devPrefix = process.env.ENV === "DEV" ? "dev." : "";

export const consoleURL = (token: string, projectName?: string) =>
  `https://${devPrefix}console.graph.cool/token?token=${token}${
    projectName ? `&redirect=/${encodeURIComponent(projectName)}` : ""
  }`;
// export const playgroundURL = (token: string, projectName: string) =>

export function sortByTimestamp(a, b) {
  return a.timestamp < b.timestamp ? -1 : 1;
}

/**
 * Print a list of [['key', 'value'],...] pairs properly padded
 * @param {string[][]} arr1
 * @param {number} spaceLeft
 * @param {number} spaceBetween
 */

export const prettyProject = p => `${chalk.bold(p.name)} (${p.id})`;

export function prettyTime(time: number): string {
  const output =
    time > 1000 ? (Math.round(time / 100) / 10).toFixed(1) + "s" : time + "ms";
  return chalk.cyan(output);
}

export function concatName(
  cluster: Cluster,
  name: string,
  workspace: string | null,
) {
  if (cluster.shared) {
    const workspaceString = workspace ? `${workspace}~` : "";
    return `${workspaceString}${name}`;
  }

  return name;
}

export const defaultDataModel = `\
type User {
  id: ID! @id
  name: String!
}
`;

export const defaultMongoDataModel = `\
type User {
  id: ID! @id
  name: String!
}
`;

export const defaultDockerCompose = `\
version: '3'
services:
  prisma:
    image: prismagraphql/prisma:1.7
    restart: always
    ports:
    - "4466:4466"
    environment:
      PRISMA_CONFIG: |
        port: 4466
        # uncomment the next line and provide the env var PRISMA_MANAGEMENT_API_SECRET=my-secret to activate cluster security
        # managementApiSecret: my-secret
`;

export const printAdminLink = link => `\n\nYou can view & edit your data here:

  ${chalk.bold(`Prisma Admin: ${link}/_admin`)}`;
