import type {
    Anoncreds,
    NativeCredentialEntry,
    NativeCredentialProve,
    NativeCredentialRevocationConfig,
    NativeNonRevokedIntervalOverride,
} from '@hyperledger/anoncreds-shared';

import { ObjectHandle } from '@hyperledger/anoncreds-shared';
import {
    anoncredsCreateCredentialDefinition,
    anoncredsCreateCredentialDefinitionFromJson,
    anoncredsCreateCredentialOfferFromJson,
    anoncredsCreateCredentialRequest,
    anoncredsCreateLinkSecret,
    anoncredsCreatePresentation,
    anoncredsCreateSchema,
    anoncredsObjectGetTypeName,
    anoncredsSetDefaultLogger,
    anoncredsValidateCredentialDefinitionFromJson,
    anoncreds_credential_definition_from_json,
    anoncreds_credential_definition_private_from_json,
    anoncreds_credential_from_json,
    anoncreds_credential_get_attribute,
    anoncreds_credential_offer_from_json,
    anoncreds_credential_request_from_json,
    anoncreds_credential_request_metadata_from_json,
    anoncreds_key_correctness_proof_from_json,
    anoncreds_object_get_json,
    anoncreds_presentation_from_json,
    anoncreds_presentation_request_from_json,
    anoncreds_process_credential,
    anoncreds_schema_from_json,
} from './anoncreds_wasm/anoncreds';


export class BrowserAnoncreds implements Anoncreds {
    public createRevocationStatusList(options: {
        revocationRegistryDefinitionId: string
        revocationRegistryDefinition: ObjectHandle
        issuerId: string
        timestamp?: number
        issuanceByDefault: boolean
    }): ObjectHandle {
        throw new Error('Method not implemented.')
    }

    public updateRevocationStatusListTimestampOnly(options: {
        timestamp: number
        currentRevocationStatusList: ObjectHandle
    }): ObjectHandle {
        throw new Error('Method not implemented.')
    }

    public updateRevocationStatusList(options: {
        timestamp?: number
        issued?: number[]
        revoked?: number[]
        revocationRegistryDefinition: ObjectHandle
        currentRevocationStatusList: ObjectHandle
    }): ObjectHandle {
        throw new Error('Method not implemented.')
    }

    public version(): string {
        return "1.0"
        // return anoncredsReactNative.version({})
    }

    public setDefaultLogger(): void {
        // anoncredsReactNative.setDefaultLogger({})
    }

    public getCurrentError(): string {
        return ""
        // return anoncredsReactNative.getCurrentError({})
    }

    public generateNonce(): string {
        return "foo"
        // return handleError(anoncredsReactNative.generateNonce({}))
    }

    public createSchema(options: {
        name: string
        version: string
        attributeNames: string[]
        issuerId: string
    }): ObjectHandle {
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.createSchema(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public createCredentialDefinition(options: {
        schemaId: string
        schema: ObjectHandle
        tag: string
        issuerId: string
        signatureType: string
        supportRevocation: boolean
    }): {
        credentialDefinition: ObjectHandle
        credentialDefinitionPrivate: ObjectHandle
        keyCorrectnessProof: ObjectHandle
    } {
        throw new Error("Method not implemented.")
        // const { keyCorrectnessProof, credentialDefinition, credentialDefinitionPrivate } = handleError(
        //     anoncredsReactNative.createCredentialDefinition(serializeArguments(options))
        // )

        // return {
        //     credentialDefinitionPrivate: new ObjectHandle(credentialDefinitionPrivate),
        //     credentialDefinition: new ObjectHandle(credentialDefinition),
        //     keyCorrectnessProof: new ObjectHandle(keyCorrectnessProof),
        // }
    }

    public createCredential(options: {
        credentialDefinition: ObjectHandle
        credentialDefinitionPrivate: ObjectHandle
        credentialOffer: ObjectHandle
        credentialRequest: ObjectHandle
        attributeRawValues: Record<string, string>
        attributeEncodedValues?: Record<string, string>
        revocationRegistryId?: string
        revocationStatusList?: ObjectHandle
        revocationConfiguration?: NativeCredentialRevocationConfig
    }): ObjectHandle {
        throw new Error('Method not implemented.')
    }

    public encodeCredentialAttributes(options: { attributeRawValues: Array<string> }): Array<string> {
        throw new Error('Method not implemented.')
    }

    public processCredential(options: {
        credential: ObjectHandle
        credentialRequestMetadata: ObjectHandle
        linkSecret: string
        credentialDefinition: ObjectHandle
        revocationRegistryDefinition?: ObjectHandle
    }): ObjectHandle {
        const credProcessed = anoncreds_process_credential(
            options.credential.handle,
            options.credentialRequestMetadata.handle,
            options.linkSecret,
            options.credentialDefinition.handle,
            options.revocationRegistryDefinition ? options.revocationRegistryDefinition.handle : 0
        )
        return new ObjectHandle(credProcessed.cred)
    }

    public createCredentialOffer(options: {
        schemaId: string
        credentialDefinitionId: string
        keyCorrectnessProof: ObjectHandle
    }): ObjectHandle {
        throw new Error('Method not implemented.')
    }

    public createCredentialRequest(options: {
        entropy?: string
        proverDid?: string
        credentialDefinition: ObjectHandle
        linkSecret: string
        linkSecretId: string
        credentialOffer: ObjectHandle
    }): { credentialRequest: ObjectHandle; credentialRequestMetadata: ObjectHandle } {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const credReqResponse = anoncredsCreateCredentialRequest(
            options.entropy! || "",
            options.proverDid! || "",
            options.credentialDefinition.handle,
            options.linkSecret,
            options.linkSecretId,
            options.credentialOffer.handle
        )
        const res = {
            credentialRequest: new ObjectHandle(credReqResponse.cred_req as number),
            credentialRequestMetadata: new ObjectHandle(credReqResponse!.cred_req_metadata as number),
        }
        return res
    }

    public createLinkSecret(): string {
        const s = anoncredsCreateLinkSecret() as string
        return s
        // return handleError(anoncredsReactNative.createLinkSecret({}))
    }

    public createPresentation(options: {
        presentationRequest: ObjectHandle
        credentials: NativeCredentialEntry[]
        credentialsProve: NativeCredentialProve[]
        selfAttest: Record<string, string>
        linkSecret: string
        schemas: Record<string, ObjectHandle>
        credentialDefinitions: Record<string, ObjectHandle>
    }): ObjectHandle {
        // throw new Error('Method not implemented.')
        const selfAttestNames = Object.keys(options.selfAttest)
        const selfAttestValues = Object.values(options.selfAttest)
        const schemaKeys = Object.keys(options.schemas)
        const schemaValues = Object.values(options.schemas).map((o) => o.handle)
        const credentialDefinitionKeys = Object.keys(options.credentialDefinitions)
        const credentialDefinitionValues = Object.values(options.credentialDefinitions).map((o) => o.handle)

        const credentialEntries = options.credentials.map((value) => ({
            credential: value.credential.handle,
            timestamp: value.timestamp ?? -1,
            rev_state: value.revocationState?.handle ?? 0,
        }))
        const pres = anoncredsCreatePresentation(
            options.presentationRequest.handle,
            credentialEntries,
            options.credentialsProve.map((o) => ({
                entry_idx: o.entryIndex,
                referent: o.referent,
                is_predicate: o.isPredicate,
                reveal: o.reveal,
            })),
            selfAttestNames,
            selfAttestValues,
            options.linkSecret,
            schemaValues as any,
            schemaKeys,
            credentialDefinitionValues as any,
            credentialDefinitionKeys
        )
        
        return new ObjectHandle(parseInt(pres))
    }

    public verifyPresentation(options: {
        presentation: ObjectHandle
        presentationRequest: ObjectHandle
        schemas: ObjectHandle[]
        schemaIds: string[]
        credentialDefinitions: ObjectHandle[]
        credentialDefinitionIds: string[]
        revocationRegistryDefinitions?: ObjectHandle[]
        revocationRegistryDefinitionIds?: string[]
        revocationStatusLists?: ObjectHandle[]
        nonRevokedIntervalOverrides?: NativeNonRevokedIntervalOverride[]
    }): boolean {
        
        throw new Error('Method not implemented.')
        // return Boolean(handleError(anoncredsReactNative.verifyPresentation(serializeArguments(options))))
    }

    public createRevocationRegistryDefinition(options: {
        credentialDefinition: ObjectHandle
        credentialDefinitionId: string
        tag: string
        revocationRegistryType: string
        issuerId: string
        maximumCredentialNumber: number
        tailsDirectoryPath?: string
    }): {
        revocationRegistryDefinition: ObjectHandle
        revocationRegistryDefinitionPrivate: ObjectHandle
    } {
        
        throw new Error('Method not implemented.')
    }

    public createOrUpdateRevocationState(options: {
        revocationRegistryDefinition: ObjectHandle
        revocationStatusList: ObjectHandle
        revocationRegistryIndex: number
        tailsPath: string
        oldRevocationState?: ObjectHandle
        oldRevocationStatusList?: ObjectHandle
    }): ObjectHandle {
        
        throw new Error('Method not implemented.')
    }

    public presentationRequestFromJson(options: { json: string }): ObjectHandle {
        const presRequest = anoncreds_presentation_request_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(presRequest)
        // const handle = handleError(anoncredsReactNative.presentationRequestFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public schemaGetAttribute(options: { objectHandle: ObjectHandle; name: string }): string {
        
        throw new Error("Method not implemented")
        // return handleError(anoncredsReactNative.schemaGetAttribute(serializeArguments(options)))
    }

    public revocationRegistryDefinitionGetAttribute(options: { objectHandle: ObjectHandle; name: string }): string {
        
        throw new Error("Method not implemented")
        // return handleError(anoncredsReactNative.revocationRegistryDefinitionGetAttribute(serializeArguments(options)))
    }

    public credentialGetAttribute(options: { objectHandle: ObjectHandle; name: string }): string {
        const value = anoncreds_credential_get_attribute(
            options.objectHandle.handle,
            options.name,
        )
        
        return value
    }

    public getJson(options: { objectHandle: ObjectHandle }): string {
        
        const json = anoncreds_object_get_json(options.objectHandle.handle)
        
        return json
        // return handleError(anoncredsReactNative.getJson(serializeArguments(options)))
    }

    public getTypeName(options: { objectHandle: ObjectHandle }): string {
        
        const typeName = anoncredsObjectGetTypeName(options.objectHandle.handle)
        
        return typeName
        // return handleError(anoncredsReactNative.getTypeName(serializeArguments(options)))
    }

    public objectFree(options: { objectHandle: ObjectHandle }): void {
        
        // return handleError(anoncredsReactNative.objectFree(serializeArguments(options)))
    }

    public credentialDefinitionGetAttribute(options: { objectHandle: ObjectHandle; name: string }): string {
        
        throw new Error("Method not implemented")
        // return handleError(anoncredsReactNative.credentialDefinitionGetAttribute(serializeArguments(options)))
    }

    public revocationRegistryDefinitionFromJson(options: { json: string }): ObjectHandle {
        
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.revocationRegistryDefinitionFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public revocationRegistryFromJson(options: { json: string }): ObjectHandle {
        
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.revocationRegistryFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public revocationStatusListFromJson(options: { json: string }): ObjectHandle {
        
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.revocationStatusListFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public presentationFromJson(options: { json: string }): ObjectHandle {
        
        // throw new Error('Method not implemented.')
        const presentation = anoncreds_presentation_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(presentation)
        // const handle = handleError(anoncredsReactNative.presentationFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public credentialOfferFromJson(options: { json: string }): ObjectHandle {
        const credOffer = anoncreds_credential_offer_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(credOffer)
        
        // throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.credentialOfferFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public schemaFromJson(options: { json: string }): ObjectHandle {
        const schema = anoncreds_schema_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(schema)
        // const handle = handleError(anoncredsReactNative.schemaFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public credentialRequestFromJson(options: { json: string }): ObjectHandle {
        const credReq = anoncreds_credential_request_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(credReq)
    }

    public credentialRequestMetadataFromJson(options: { json: string }): ObjectHandle {
        const credReqMetadata = anoncreds_credential_request_metadata_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(credReqMetadata)
    }

    public credentialFromJson(options: { json: string }): ObjectHandle {
        const cred = anoncreds_credential_from_json(JSON.parse(options.json))
        
        return new ObjectHandle(cred)
        
        throw new Error('Method not implemented.')
        // const handle = handleError(credentialFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public revocationRegistryDefinitionPrivateFromJson(options: { json: string }): ObjectHandle {
        throw new Error('Method not implemented.')
        // const handle = handleError(
        //     anoncredsReactNative.revocationRegistryDefinitionPrivateFromJson(serializeArguments(options))
        // )
        // return new ObjectHandle(handle)
    }

    public revocationStateFromJson(options: { json: string }): ObjectHandle {
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.revocationStateFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }
    public credentialDefinitionFromJson(options: { json: string }): ObjectHandle {
        const credDef = anoncreds_credential_definition_from_json(JSON.parse(options.json))
        return new ObjectHandle(credDef)
        // throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.credentialDefinitionFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public credentialDefinitionPrivateFromJson(options: { json: string }): ObjectHandle {
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.credentialDefinitionPrivateFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }

    public keyCorrectnessProofFromJson(options: { json: string }): ObjectHandle {
        throw new Error('Method not implemented.')
        // const handle = handleError(anoncredsReactNative.keyCorrectnessProofFromJson(serializeArguments(options)))
        // return new ObjectHandle(handle)
    }
}
