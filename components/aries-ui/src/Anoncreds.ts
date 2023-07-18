import type {
    AnonCredsRegistry, GetCredentialDefinitionReturn, GetRevocationRegistryDefinitionReturn,
    GetRevocationStatusListReturn, GetSchemaReturn, RegisterCredentialDefinitionOptions,
    RegisterCredentialDefinitionReturn, RegisterSchemaOptions,
    RegisterSchemaReturn
} from '@aries-framework/anoncreds';
import type { AgentContext } from '@aries-framework/core';
import axios, { AxiosError } from 'axios';
import { Logger } from "tslog"

const log = new Logger({ name: "RestAnoncredsRegistry" })
const endpoint = "http://localhost:3554";
/**
 * Remote RESTful implementation of the {@link AnonCredsRegistry} interface.
 */
export class RESTfulAnonCredsRegistry implements AnonCredsRegistry {
    public readonly supportedIdentifier = /.+/

    public constructor({ }: {} = {}) { }

    public readonly methodName = 'restful'

    getRevocationRegistryDefinition(agentContext: AgentContext, revocationRegistryDefinitionId: string): Promise<GetRevocationRegistryDefinitionReturn> {
        throw new Error('Method not implemented.')
    }
    getRevocationStatusList(agentContext: AgentContext, revocationRegistryId: string, timestamp: number): Promise<GetRevocationStatusListReturn> {
        throw new Error('Method not implemented.')
    }

    public async getSchema(agentContext: AgentContext, schemaId: string): Promise<GetSchemaReturn> {
        try {
            const response = await axios.get(`${endpoint}/schemas/${schemaId}`);
            const schemaJson = response.data;

            return {
                resolutionMetadata: {},
                schema: {
                    name: schemaJson.name,
                    attrNames: schemaJson.attributes,
                    issuerId: schemaJson.issuerId,
                    version: schemaJson.version,
                },
                schemaId,
                schemaMetadata: {},
            };
        } catch (error) {
            log.error('Error getting schema', { error: error.message });
            return {
                resolutionMetadata: {
                    error: 'notFound',
                    message: `Schema with id ${schemaId} not found in RESTful API`,
                },
                schemaId,
                schemaMetadata: {},
            };
        }
    }

    public async registerSchema(
        agentContext: AgentContext,
        options: RegisterSchemaOptions
    ): Promise<RegisterSchemaReturn> {
        try {
            const response = await axios.post(`${endpoint}/schemas`, options.schema);
            log.info('Registered schema', { schema: response.data });
            const schemaId = response.data.id;
            return {
                registrationMetadata: {},
                schemaMetadata: {},
                schemaState: {
                    state: 'finished',
                    schema: options.schema,
                    schemaId,
                },
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            log.error('Error registering schema', { error: error.message, data: axiosError.response.data });
            return {
                registrationMetadata: {
                    error: 'failed',
                    message: `Failed to register schema in RESTful API: ${error.message}`,
                },
                schemaMetadata: {},
                schemaState: {
                    state: 'failed',
                    reason: `Failed to register schema in RESTful API: ${error.message}`,
                }
            }
        }
    }

    public async getCredentialDefinition(
        agentContext: AgentContext,
        credentialDefinitionId: string
    ): Promise<GetCredentialDefinitionReturn> {
        log.info('Getting credential definition', { credentialDefinitionId });
        try {
            const response = await axios.get(`${endpoint}/credentialDefinition/${credentialDefinitionId}`);
            const credentialDefinitionJson = response.data;

            return {
                resolutionMetadata: {},
                credentialDefinition: {
                    ...credentialDefinitionJson,
                    id: credentialDefinitionId,
                    schemaId: credentialDefinitionJson.schema.id,
                    type: credentialDefinitionJson.type,
                    value: credentialDefinitionJson.value,
                },
                credentialDefinitionId,
                credentialDefinitionMetadata: {},
            };
        } catch (error) {
            log.error('Error getting credential definition', { error: error.message });
            return {
                resolutionMetadata: {
                    error: 'notFound',
                    message: `Credential definition with id ${credentialDefinitionId} not found in RESTful API`,
                },
                credentialDefinitionId,
                credentialDefinitionMetadata: {},
            };
        }
    }

    public async registerCredentialDefinition(
        agentContext: AgentContext,
        options: RegisterCredentialDefinitionOptions
    ): Promise<RegisterCredentialDefinitionReturn> {
        log.info('Registering credential definition', { options });
        try {
            const response = await axios.post(`${endpoint}/credentialDefinition`, options.credentialDefinition);
            const credentialDefinitionId = response.data.id;
            return {
                registrationMetadata: {},
                credentialDefinitionMetadata: {},
                credentialDefinitionState: {
                    state: 'finished',
                    credentialDefinition: options.credentialDefinition,
                    credentialDefinitionId,
                },
            };
        } catch (error) {
            const axiosError = error as AxiosError;
            log.error('Error registering credential definition', { error: error.message, data: axiosError.response.data });
            return {
                registrationMetadata: {
                    error: 'failed',
                    message: `Failed to register credential definition in RESTful API: ${error.message}`,
                },
                credentialDefinitionMetadata: {},
                credentialDefinitionState: {
                    state: 'failed',
                    reason: `Failed to register credential definition in RESTful API: ${error.message}`,
                }
            }
        }
    }
}