import { useCredentialById } from "@aries-framework/react-hooks";
import {
  AtSymbolIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { useParams } from "react-router-dom";

export default function Credential() {
  const { credentialId } = useParams();
  const credential = useCredentialById(credentialId);
  return (
    <div className="space-y-4">
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Credential {credential?.id}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <UserIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {credential?.metadata.data["_anoncreds/credential"].schemaId}
            </div>

            <div className="mt-2 flex items-center text-sm text-gray-500">
              <AtSymbolIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {
                credential?.metadata.data["_anoncreds/credential"]
                  .credentialDefinitionId
              }
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {credential.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              {credential.credentialAttributes.map((attr) => (
                <div
                  className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
                  key={attr.name}
                >
                  <dt className="text-sm font-medium leading-6 text-gray-900 capitalize">
                    {attr.name}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {attr.value}
                  </dd>
                </div>
              ))}

              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  Schema ID
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {credential?.metadata.data["_anoncreds/credential"].schemaId}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  Credential Definition ID
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {
                    credential?.metadata.data["_anoncreds/credential"]
                      .credentialDefinitionId
                  }
                </dd>
              </div>

              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  State
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {credential?.state}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
