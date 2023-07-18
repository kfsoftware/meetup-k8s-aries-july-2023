import { BasicMessageRole } from "@aries-framework/core";
import {
  useBasicMessagesByConnectionId,
  useConnectionById,
} from "@aries-framework/react-hooks";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAries } from "./AriesProvider";

import {
  AtSymbolIcon,
  CalendarIcon,
  UserIcon
} from "@heroicons/react/20/solid";

const ChatUI = () => {
  const { connectionId } = useParams();
  const conn = useConnectionById(connectionId as string);
  const records = useBasicMessagesByConnectionId(connectionId as string);
  const { agent } = useAries();
  const [newMessage, setNewMessage] = useState("");

  const handleNewMessageChange = (event) => {
    setNewMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    await agent!.basicMessages.sendMessage(connectionId!, newMessage);
    setNewMessage("");
  };
  return (
    <div className="space-y-4">
      <div className="lg:flex lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Chat with {conn?.theirLabel}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <UserIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {conn?.theirDid}
            </div>

            <div className="mt-2 flex items-center text-sm text-gray-500">
              <AtSymbolIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {conn?.role}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon
                className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {new Date(conn!.createdAt!).toLocaleString()}
            </div>
          </div>
        </div>

      </div>
      <div className="flex flex-col h-full bg-gray-100">
        <div className="overflow-auto p-4">
          {records
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((message) => (
              <div key={message.id} className="mb-4">
                <div className="flex justify-between">
                  <div className="font-bold mb-1">
                    {message.role === BasicMessageRole.Receiver
                      ? conn?.theirLabel
                      : (agent as any).agentConfig.label}
                  </div>
                  {new Date(message.sentTime).toLocaleString()}
                </div>
                <div className="bg-white rounded px-4 py-2 shadow">
                  {message.content}
                </div>
              </div>
            ))}
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex space-x-3">
            <input
              className="flex-1 bg-gray-200 rounded-lg px-4 py-2 outline-none"
              value={newMessage}
              onChange={handleNewMessageChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              type="text"
              placeholder="Type your message"
            />
            <button
              className="bg-blue-500 text-white rounded-lg px-4 py-2"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
export default ChatUI;
