import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService
} from "@aries-framework/anoncreds";
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  BasicMessageEventTypes,
  BasicMessageStateChangedEvent,
  ConnectionsModule,
  ConsoleLogger,
  CredentialsModule,
  DidsModule,
  InitConfig,
  KeyDidResolver,
  LogLevel,
  MediationRecipientModule,
  PeerDidResolver,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WsOutboundTransport,
} from "@aries-framework/core";
import AgentProvider from "@aries-framework/react-hooks";

import { createContext, useCallback, useContext, useState } from "react";
import "./App.css";

import { AnonCredsRsModule } from "@aries-framework/anoncreds-rs";
import { BrowserAnoncreds } from './BrowserAnoncreds.ts';

import { RESTfulAnonCredsRegistry } from "./Anoncreds";
import { mediatorInvitationUrl } from "./constants";
import { BrowserWalletModule } from "./wallet/BrowserWalletModule.ts";
import { agentDependencies } from "./wallet/agentDependencies.ts";
import { HttpOutboundTransport } from "./wallet/HttpOutboundTransport.ts";

function getAgentModules(mediatorInvitationUrl: string) {
  const anonCredsCredentialFormatService =
    new AnonCredsCredentialFormatService();
  const anoncredsProofFormatService = new AnonCredsProofFormatService();

  return {
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),
    dids: new DidsModule({
      resolvers: [new PeerDidResolver(), new KeyDidResolver()],
    }),
    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.Always,
      credentialProtocols: [
        new V2CredentialProtocol({
          credentialFormats: [anonCredsCredentialFormatService],
        }),
      ],
    }),

    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.Always,
      proofProtocols: [
        new V2ProofProtocol({
          proofFormats: [anoncredsProofFormatService],
        }),
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new RESTfulAnonCredsRegistry()],
    }),
    anoncredsRs: new AnonCredsRsModule({
      anoncreds: new BrowserAnoncreds(),
    }),
    mediationRecipient: new MediationRecipientModule({
      mediatorInvitationUrl,
    }),
    wallet: new BrowserWalletModule({}),
  };
}

interface AriesContextValue {
  agent: Agent<ReturnType<typeof getAgentModules>> | undefined;
  setAgent: React.Dispatch<
    React.SetStateAction<Agent<ReturnType<typeof getAgentModules>> | undefined>
  >;
  initializeAgent: (
    agentId: string,
    agentLabel: string,
    password: string
  ) => Promise<void>;
}
// Create a new context for Aries
const AriesContext = createContext<AriesContextValue>({
  agent: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAgent: () => {},
  initializeAgent: (agentId: string, agentLabel: string, password: string) =>
    Promise.resolve(),
});

interface AriesProviderProps {
  children: React.ReactNode;
}
const useAries = () => {
  const ariesContext = useContext(AriesContext);
  if (ariesContext === undefined) {
    throw new Error("useAries must be used within a AriesProvider");
  }
  return ariesContext;
};

const AriesProvider = ({ children }: AriesProviderProps) => {
  const [agent, setAgent] =
    useState<Agent<ReturnType<typeof getAgentModules>>>();
  const initializeAgent = useCallback(
    async (agentId: string, agentLabel: string, password: string) => {
      const config: InitConfig = {
        label: agentLabel,
        walletConfig: {
          id: agentId,
          key: password,
        },
        logger: new ConsoleLogger(LogLevel.trace),
        autoUpdateStorageOnStartup: true,
      };
      const modules = getAgentModules(mediatorInvitationUrl);

      const ariesAgent = new Agent({
        config,
        dependencies: agentDependencies,
        modules: modules,
      });
      ariesAgent.registerOutboundTransport(new WsOutboundTransport());
      ariesAgent.registerOutboundTransport(new HttpOutboundTransport());
      // log all basic message state changes
      ariesAgent.events.on<BasicMessageStateChangedEvent>(
        BasicMessageEventTypes.BasicMessageStateChanged,
        (event) => {
          console.log("BasicMessageStateChangedEvent", event);
        }
      );
      await ariesAgent.initialize();
      const anoncreds = ariesAgent.modules.anoncreds;
      const defaultSecretId = "myLinkId";
      const secretIds = await anoncreds.getLinkSecretIds();
      if (!secretIds.includes(defaultSecretId)) {
        await anoncreds.createLinkSecret({
          linkSecretId: defaultSecretId,
          setAsDefault: true,
        });
      }
      setAgent(ariesAgent);
    },
    [setAgent]
  );
  console.log("agent", agent);
  // Provide the AriesContext value to its children
  return (
    <AgentProvider agent={agent}>
      <AriesContext.Provider value={{ agent, setAgent, initializeAgent }}>
        {children}
      </AriesContext.Provider>
    </AgentProvider>
  );
};

export { AriesContext, AriesProvider, useAries };

