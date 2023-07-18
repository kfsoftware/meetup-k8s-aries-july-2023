import { useAgent, useConnections } from "@aries-framework/react-hooks";
import { useAries } from "./AriesProvider";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface ShowInvitationURLProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
function ShowInvitationURL({ open, setOpen }: ShowInvitationURLProps) {
  const [invitationUrl, setInvitationUrl] = useState("");
  const { agent } = useAries();
  const generateInvitationUrl = useCallback(async () => {
    if (!agent) {
      return;
    }
    try {
      console.log("Trying to create invitation", agent.oob);
      const { outOfBandInvitation } = await agent.oob.createInvitation({
        multiUseInvitation: false,
      });
      console.log(outOfBandInvitation);
      const invitationUrl = outOfBandInvitation.toUrl({
        domain: window.location.host,
      });
      setInvitationUrl(invitationUrl);
    } catch (e) {
      console.log("Error creating invitation", e);
    }
  }, [setInvitationUrl, agent]);
  useEffect(() => {
    if (!open) return;
    generateInvitationUrl();
  }, [generateInvitationUrl, open]);
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="mt-3 text-left sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Invitation URL
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{invitationUrl}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface AcceptInvitationProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
function AcceptInvitation({ open, setOpen }: AcceptInvitationProps) {
  const agent = useAgent();
  const [invitationUrl, setInvitationUrl] = useState("");
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="mt-3 text-left sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Accept invitation
                    </Dialog.Title>
                    <div className="mt-2">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Invitation URL
                        </label>
                        <div className="mt-2">
                          <input
                            name="invitationUrl"
                            id="invitationUrl"
                            value={invitationUrl}
                            onChange={(e) => setInvitationUrl(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={async () => {
                      const inv =
                        await agent?.agent!.oob.receiveInvitationFromUrl(
                          invitationUrl
                        );
                      await agent.agent?.connections.returnWhenIsConnected(
                        inv!.connectionRecord!.id!
                      );
                      setOpen(false);
                    }}
                  >
                    Accept invitation
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function Connections() {
  const [showInvitation, setShowInvitation] = useState(false);
  const connections = useConnections();
  const [acceptInvitationOpen, setAcceptInvitationOpen] = useState(false);
  console.log("connections", connections);
  // return <p>Connections</p>
  // const { agent } = useAries();
  // const connections = useConnections();
  return (
    <>
      {/* <AcceptInvitation
        open={acceptInvitationOpen}
        setOpen={setAcceptInvitationOpen}
      />
      <ShowInvitationURL open={showInvitation} setOpen={setShowInvitation} /> */}

      <AcceptInvitation
        open={acceptInvitationOpen}
        setOpen={setAcceptInvitationOpen}
      />
      <ShowInvitationURL open={showInvitation} setOpen={setShowInvitation} />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900">
              Connections
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              All of your connections in one place.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex">
            <button
              onClick={() => {
                setShowInvitation(true);
              }}
              type="button"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get invitation URL
            </button>
            <button
              onClick={async () => {
                setAcceptInvitationOpen(true);
              }}
              type="button"
              className="mt-2 sm:mt-0 sm:ml-3 block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Accept invitation
            </button>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                      Id
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      State
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Their DID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Their label
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {connections.records?.map((conn) => (
                    <tr key={conn.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <Link to={`/dashboard/chat/${conn.id}`}>{conn.id}</Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {conn.state}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {conn.connectionTypes.join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {conn.theirDid}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {conn.theirLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
