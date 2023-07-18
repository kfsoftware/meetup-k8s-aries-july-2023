import { useProofById } from "@aries-framework/react-hooks";
import {
  AtSymbolIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAries } from "./AriesProvider";
import {
  DidCommMessageRepository,
  V2PresentationMessage,
  Buffer,
} from "@aries-framework/core";

export default function Proof() {
  const { proofId } = useParams();
  const proof = useProofById(proofId);
  const { agent } = useAries();
  const [presentationMessage, setPresentationMessage] =
    useState<V2PresentationMessage | null>(null);
  const loadPresentationMessage = useCallback(async () => {
    const didCommMessageRepository =
      agent.dependencyManager.resolve<DidCommMessageRepository>(
        DidCommMessageRepository
      );
    const agentMessage = await didCommMessageRepository.findAgentMessage(
      agent.context,
      {
        associatedRecordId: proof.id,
        messageClass: V2PresentationMessage,
      }
    );
    setPresentationMessage(agentMessage);
    console.log("agentMessage", agentMessage);
  }, [agent.context, agent.dependencyManager, proof.id]);
  useEffect(() => {
    void loadPresentationMessage();
  }, []);
  const presentation = useMemo(() => {
    if (!presentationMessage) {
      return null;
    }
    const data = JSON.parse(
      Buffer.from(
        presentationMessage?.presentationAttachments[0].data.base64!,
        "base64"
      ).toString("utf-8")
    );
    return {
      identifiers: data.identifiers,
      requested_proof: data.requested_proof,
    };
  }, [presentationMessage]);
  console.log("proof", proof);
  return (
    <div className="space-y-4">
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Proof {proof?.id}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <UserIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {/* {proof?.metadata.data["_anoncreds/credential"].schemaId} */}
            </div>

            <div className="mt-2 flex items-center text-sm text-gray-500">
              <AtSymbolIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {/* {
                proof?.metadata.data["_anoncreds/credential"]
                  .credentialDefinitionId
              } */}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {proof.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              {/* {proof.credentialAttributes.map((attr) => (
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
              ))} */}

              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  Schema ID
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {/* {proof?.metadata.data["_anoncreds/credential"].schemaId} */}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  Credential Definition ID
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {/* {
                    proof?.metadata.data["_anoncreds/credential"]
                      .credentialDefinitionId
                  } */}
                </dd>
              </div>

              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  State
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {presentation ? (
                    <pre>{JSON.stringify(presentation, null, 4)}</pre>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
