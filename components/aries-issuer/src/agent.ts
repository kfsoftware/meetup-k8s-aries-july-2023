import {
    AnonCredsCredentialFormatService,
    AnonCredsProofFormatService,
    LegacyIndyCredentialFormatService,
    LegacyIndyProofFormatService,
    V1CredentialProtocol,
    V1ProofProtocol
} from '@aries-framework/anoncreds';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { AskarModule } from '@aries-framework/askar';
import cors from 'cors';
import {
    Agent, AutoAcceptCredential,
    AutoAcceptProof, ConnectionState, ConnectionsModule, ConsoleLogger, CredentialsModule, DependencyManager, DidCommMessageRepository, DidExchangeState, DidsModule, HttpOutboundTransport, InitConfig, KeyDidRegistrar, KeyDidResolver, KeyType, LogLevel, PeerDidResolver, ProofState, ProofsModule, V2CredentialProtocol,
    V2PresentationMessage,
    V2ProofProtocol, WsOutboundTransport,
} from "@aries-framework/core";
import { AnonCredsApi, AnonCredsSchemaRecord, RegisterCredentialDefinitionReturn, RegisterSchemaReturn } from "@aries-framework/anoncreds";
import { AnonCredsModule } from "@aries-framework/anoncreds"
import { IndyVdrSovDidResolver } from '@aries-framework/indy-vdr';
import { HttpInboundTransport, agentDependencies } from "@aries-framework/node";
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import type { Express } from "express";
import express from "express";
import { Logger } from "tslog";
import { RESTfulAnonCredsRegistry } from './RestAnoncredsRegistry';

const log = new Logger({ name: "agent.ts" })

const config = {
    agentLabel: process.env.AGENT_LABEL || 'Issuer Meetup Aries',
    walletName: process.env.WALLET_NAME || 'IssuerMeetupAries1',
    walletKey: process.env.WALLET_KEY || 'IssuerMeetupAries',
}
const port = process.env.AGENT_PORT ? Number(process.env.AGENT_PORT) : 3556
const endpoints = [`http://localhost:${port}`, `ws://localhost:${port}`]
async function initializeAgent(
    port: number,
    app: Express,
) {
    const agentLabel = config.agentLabel
    const agentId = config.walletName
    const agentKey = config.walletKey
    const agentConfig: InitConfig = {
        label: agentLabel,
        walletConfig: {
            id: agentId,
            key: agentKey,
        },
        endpoints: endpoints,
        logger: new ConsoleLogger(LogLevel.error),
        autoUpdateStorageOnStartup: true,
    }
    const dependencyManager = new DependencyManager()
    const ariesAgent = new Agent(
        {
            config: agentConfig,
            dependencies: agentDependencies,
            modules: await getAskarAnonCredsIndyModules(),
        },
        dependencyManager
    )

    ariesAgent.registerInboundTransport(new HttpInboundTransport({
        port,
        app,
    }))

    ariesAgent.registerOutboundTransport(new WsOutboundTransport())

    // Register a simple `Http` outbound transport
    ariesAgent.registerOutboundTransport(new HttpOutboundTransport())
    log.info("Initializing agent...")
    await ariesAgent.initialize()
    log.info("Agent initialized...")
    return ariesAgent
}
function getAskarAnonCredsIndyModules() {
    const legacyIndyCredentialFormatService = new LegacyIndyCredentialFormatService()
    const anonCredsCredentialFormatService = new AnonCredsCredentialFormatService()
    const legacyIndyProofFormatService = new LegacyIndyProofFormatService()
    const anoncredsProofFormatService = new AnonCredsProofFormatService()

    return {
        connections: new ConnectionsModule({
            autoAcceptConnections: true,
        }),
        credentials: new CredentialsModule({
            autoAcceptCredentials: AutoAcceptCredential.Always,
            credentialProtocols: [
                new V1CredentialProtocol({
                    indyCredentialFormat: legacyIndyCredentialFormatService,
                }),
                new V2CredentialProtocol({
                    credentialFormats: [
                        anonCredsCredentialFormatService,
                    ],
                }),
            ],
        }),
        proofs: new ProofsModule({
            autoAcceptProofs: AutoAcceptProof.Always,
            proofProtocols: [
                new V1ProofProtocol({
                    indyProofFormat: legacyIndyProofFormatService,
                }),
                new V2ProofProtocol({
                    proofFormats: [
                        anoncredsProofFormatService
                    ],
                }),
            ],
        }),
        anoncreds: new AnonCredsModule({
            registries: [new RESTfulAnonCredsRegistry()],
        }),
        anoncredsRs: new AnonCredsRsModule({
            anoncreds
        }),
        dids: new DidsModule({
            resolvers: [new IndyVdrSovDidResolver(), new PeerDidResolver(), new KeyDidResolver()],
            registrars: [new KeyDidRegistrar()]
        }),
        askar: new AskarModule({
            ariesAskar
        }),
    } as const
}

async function main() {
    const agentApp = express()
    agentApp.use(express.json())
    agentApp.use(cors())
    agentApp.use(express.urlencoded({ extended: true }))
    agentApp.get("/ping", (req, res) => {
        res.send("pong");
    });
    agentApp.get("/invitation", async (req, res) => {
        try {
            const { alias = "user" } = req.query
            const { outOfBandInvitation } = await mainAgent.oob.createInvitation({
                multiUseInvitation: true,
                alias: alias as string,
                autoAcceptConnection: true,
            })
            const url = outOfBandInvitation.toUrl({ domain: "https://example.org" })
            res.send(url)
        } catch (e) {
            log.error(`Error creating invitation`, e.toString())
            res.send(e)
        }
    });
    agentApp.get("/connections", async (req, res) => {
        try {
            const connections = await mainAgent!.connections.findAllByQuery({
                state: DidExchangeState.Completed,
            })
            res.send(connections)
        } catch (e) {
            log.error(e)
            res.send(e)
        }
    });
    agentApp.get("/proofs", async (req, res) => {
        try {
            const proofs = await mainAgent!.proofs.findAllByQuery({})
            res.send(proofs.map((proof) => {
                return {
                    ...proof,
                    tags: proof.getTags(),
                }
            }))
        } catch (e) {
            log.error(e)
            res.send(e)
        }
    });
    agentApp.get("/proofs/:proofId", async (req, res) => {
        try {
            const { proofId } = req.params
            const proof = await mainAgent!.proofs.findById(proofId)
            const didCommMessageRepository = mainAgent.dependencyManager.resolve<DidCommMessageRepository>(DidCommMessageRepository)
            const presentationMessage = await didCommMessageRepository.findAgentMessage(mainAgent.context, {
                associatedRecordId: proof.id,
                messageClass: V2PresentationMessage
            });
            res.send({
                ...proof,
                tags: proof.getTags(),
                presentationMessage: presentationMessage ? presentationMessage.toJSON() : null,
            })
        } catch (e) {
            log.error(e)
            res.send(e)
        }
    });
    agentApp.get("/request-proof", async (req, res) => {
        const { connection_id: connectionId, minAge } = req.query
        if (!connectionId) {
            res.send({ message: "Missing connection_id" }).status(400)
            return
        }
        const age = minAge ? Number(minAge) : 18
        if (isNaN(age)) {
            res.send({ message: "Invalid minAge" }).status(400)
            return
        }
        try {
            const requestProof = await mainAgent.proofs.requestProof({
                connectionId: connectionId as string,
                protocolVersion: "v2",
                autoAcceptProof: AutoAcceptProof.Always,
                proofFormats: {
                    anoncreds: {
                        requested_predicates: {
                            age: {
                                name: 'age',
                                p_type: '>=',
                                p_value: age,
                            },
                        },
                        requested_attributes: {
                            name: {
                                name: 'name',
                            },
                        },
                        name: 'Proof Request',
                        version: '1.0',
                    }
                },
            })
            res.send(requestProof.toJSON())
        } catch (e) {
            log.error(e)
            res.send(e)
        }
    })

    agentApp.get("/offer-credential", async (req, res) => {
        try {
            const { connection_id: connectionId, name = "John", age = "30" } = req.query
            log.info(`offer-credential`, { connectionId, name, age })
            const offerCredential = await mainAgent.credentials.offerCredential({
                connectionId: connectionId as string,
                protocolVersion: 'v2' as never,
                autoAcceptCredential: AutoAcceptCredential.Always,
                credentialFormats: {
                    anoncreds: {
                        attributes: [
                            {
                                name: 'name',
                                value: name as string,
                                mimeType: 'text/plain',
                            },
                            {
                                name: 'age',
                                value: age as string,
                                mimeType: 'text/plain',
                            }
                        ],
                        credentialDefinitionId: credDefID,
                    },
                },
                comment: 'v2 propose credential test',
            })
            res.send(offerCredential)
        } catch (e) {
            log.error(e)
            res.send(e)
        }
    });


    const mainAgent = await initializeAgent(
        port,
        agentApp
    )
    const anonCreds = (mainAgent.modules as any).anoncreds as AnonCredsApi
    const defaultSecretId = "myLinkId"
    const secretIds = await (mainAgent as any).modules.anoncreds.getLinkSecretIds()
    log.info(`anoncreds agent secretIds`, { secretIds })
    if (!secretIds.includes(defaultSecretId)) {
        await anonCreds.createLinkSecret({
            linkSecretId: defaultSecretId,
            setAsDefault: true,
        })
    }
    let createdDids = await mainAgent.dids.getCreatedDids({
        method: "key"
    })
    if (createdDids.length === 0) {
        await mainAgent.dids.create({
            method: "key",
            options: {
                keyType: KeyType.Ed25519,
            },
        })
        createdDids = await mainAgent.dids.getCreatedDids({
            method: "key"
        })
    }
    const did = createdDids[0].did
    const schemaTemplate = {
        name: "personal-info",
        version: "1.0",
        attrNames: ["name", "age"],
        issuerId: did,
    }
    const schema = await anonCreds.getCreatedSchemas({
        schemaName: schemaTemplate.name,
    })
    let schemaID: string | null = null
    if (schema.length > 0) {
        console.log("Schema already exists")
        schemaID = schema[0].schemaId
    } else {
        const {
            registrationMetadata,
            schemaMetadata,
            schemaState,
            jobId,
        }: RegisterSchemaReturn = await anonCreds.registerSchema({
            schema: schemaTemplate,
            options: {},
        })
        if (schemaState.state !== "finished") {
            console.log("Schema not finished", schemaState)
            throw new Error("Schema not finished")
        }
        console.log("Schema registered", schemaMetadata.schemaId)
        schemaID = schemaState.schemaId
    }
    const credDef = await anonCreds.getCreatedCredentialDefinitions({
        schemaId: schemaID,
    })
    let credDefID: string | null = null
    if (credDef.length > 0) {
        console.log("Credential definition already exists")
        credDefID = credDef[0].credentialDefinitionId
    } else {
        const {
            credentialDefinitionMetadata,
            credentialDefinitionState,
            jobId,
        }: RegisterCredentialDefinitionReturn = await anonCreds.registerCredentialDefinition(
            {
                credentialDefinition: {
                    schemaId: schemaID,
                    tag: "test",
                    issuerId: did,
                },
                options: {},
            }
        )
        if (credentialDefinitionState.state !== "finished") {
            throw new Error("Credential definition not finished")
        }
        credDefID = credentialDefinitionState.credentialDefinitionId
    }
    console.log("Cred def id", credDefID)

    log.info(`Agent listening on port ${port}`)
}
void main()