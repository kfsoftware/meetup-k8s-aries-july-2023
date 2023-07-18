import { useState } from "react";
import { useAries } from "./AriesProvider";
import { useNavigate } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

export default function CreateAgent() {
  const { initializeAgent } = useAries();
  const [agentId, setAgentId] = useState("agentId");
  const [agentLabel, setAgentLabel] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create your Hyperledger Agent
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setError("")
                await initializeAgent(agentId, agentLabel, password);
                console.log("initialized agent");
                await navigate("/dashboard");
              } catch (e) {
                console.log(e);
                setError(
                  `Error initializing agent: ${e.message}, check the agent password and try again`
                );
              }
            }}
          >
             <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Agent id
              </label>
              <div className="mt-2">
                <input
                  id="id"
                  name="id"
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="label"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Agent label
              </label>
              <div className="mt-2">
                <input
                  id="label"
                  name="label"
                  value={agentLabel}
                  onChange={(e) => setAgentLabel(e.target.value)}
                  required
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Agent password
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <input
                  type="password"
                  name="password"
                  id="password"
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6
                  ${
                    error
                      ? "text-red-900  ring-red-300 placeholder:text-red-300  focus:ring-red-500"
                      : " focus:ring-indigo-600"
                  }
`}
                  aria-invalid="true"
                  aria-describedby="password-error"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {error}
                </p>
              )}
            </div>
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
