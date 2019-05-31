import { Prompt } from "./components/BoxPrompt";
import { Element } from "./components/types";
import { render, Box } from "ink";
import React = require("react");

type DatabaseType = "mongodb" | "postgres" | "mysql";

interface DatabaseCredentials {
  type: DatabaseType;
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  alreadyData?: boolean;
  schema?: string;
  ssl?: boolean;
  uri?: string;
  executeRaw?: boolean;
}

const elements: Element<DatabaseCredentials>[] = [
  {
    type: "text-input",
    identifier: "host",
    label: "Host:",
    placeholder: "localhost",
  },
  {
    type: "text-input",
    identifier: "port",
    label: "Port:",
    placeholder: "5423",
  },
  {
    type: "text-input",
    identifier: "user",
    label: "User:",
    placeholder: "my_db_user",
  },
  {
    type: "text-input",
    identifier: "password",
    label: "Password:",
    placeholder: "my_db_password",
    mask: "*",
  },
  {
    type: "text-input",
    identifier: "database",
    label: "Database:",
    placeholder: "my_db_name",
    style: {
      marginBottom: 1,
    },
  },
  {
    type: "checkbox",
    label: "Enable SSL ?",
    identifier: "ssl",
    style: { marginBottom: 1 },
  },
  {
    type: "separator",
    dividerChar: "-",
    style: { marginBottom: 1 },
  },
  {
    type: "select",
    label: "Test",
    value: "test",
    description: "Test the database connection",
    onSelect: async ({ startSpinner, stopSpinner }) => {
      startSpinner();
      await new Promise(res => setTimeout(res, 2000));
      stopSpinner("failed");
    },
  },
  {
    type: "select",
    label: "Connection",
    value: "connection",
    description: "Start the introspection",
    onSelect: async ({ startSpinner, stopSpinner, submitPrompt }) => {
      startSpinner();
      await new Promise(res => setTimeout(res, 2000));
      stopSpinner("succeeded");
      submitPrompt();
    },
  },
];

const CHOOSE_DB: Element[] = [
  {
    type: "select",
    label: "Postgres",
    value: "postgres",
    description: "MySQL compliant databases like MySQL or MariaDB",
  },
  {
    type: "select",
    label: "MySQL",
    value: "mysql",
    description: "PostgreSQL database",
  },
  {
    type: "select",
    label: "MongoDB",
    value: "mongodb",
    description: "Mongo Database",
  },
];

enum Steps {
  CHOOSE_DB,
  CONNECT,
}

/**
 * WARNING: If you add more steps, make sure to add a `key` to the `<Prompt />`, otherwise the state between each prompt is gonna be share
 */
const Introspection: React.FC = () => {
  const [step, setStep] = React.useState<Steps>(Steps.CHOOSE_DB);
  const [credentials, setCredentials] = React.useState<
    Partial<DatabaseCredentials>
  >({});

  switch (step) {
    case Steps.CHOOSE_DB:
      return (
        <Prompt
          key={Steps.CHOOSE_DB}
          title="What kind of database do you want to introspect?"
          elements={CHOOSE_DB}
          onSubmit={({ selectedValue }) => {
            setCredentials({ ...credentials, type: selectedValue });
            setStep(Steps.CONNECT);
          }}
          withBackButton={false}
        />
      );
    case Steps.CONNECT:
      return (
        <Prompt
          key={Steps.CONNECT}
          elements={elements}
          title="Enter the Postgres credentials"
          initialFormValues={credentials}
          onSubmit={({ formValues, goBack }) => {
            const allCredentials = {
              ...credentials,
              ...formValues,
            };

            setCredentials(allCredentials);

            if (goBack) {
              return setStep(Steps.CHOOSE_DB);
            } else {
              console.log(JSON.stringify(allCredentials, null, 2));
            }
          }}
          withBackButton
        />
      );
  }
};

function run() {
  render(<Introspection />);
}

run();
