# Running Hyperledger Aries in the Browser with Hyperledger AnonCreds


## Sponsor

|                                                                         |                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![kfs logo](https://avatars.githubusercontent.com/u/74511895?s=200&v=4) | If you want to design and deploy a secure Blockchain network based on the latest version of Hyperledger Fabric, feel free to contact dviejo@kfs.es or visit [https://kfs.es/blockchain](https://kfs.es/blockchain) |


# Getting started

## Components

- Aries Issuer
- Anoncreds API
- Web Wallet using AFJ


## Set up

### Prerequisites

You need to have installed:
- NPM
- Node.JS 18

### Install dependencies

```bash
npm install
```

### Run the issuer

```bash
npm run start:dev --workspace=aries-issuer 
```

### Run the Anoncreds API

```bash
npm run start:dev --workspace=anoncreds-api
```

### Run the Web Wallet

```bash
npm run dev --workspace=aries-ui
```



### Tutorial


Start the issuer-api and the anoncreds-api in two different terminals:

```bash
npm run start:dev --workspace=aries-issuer
npm run start:dev --workspace=anoncreds-api
```



## Aries Issuer


The Aries Issuer API provides an interface for establishing secure, peer-to-peer connections between agents, issuing verifiable credentials and requesting proofs.

### Features

- Agent Connection: Establish a secure connection between two Aries agents using the decentralized identity (DID) communication protocols.
- Credentials Issuance: Issue digital identities as verifiable credentials, backed using cryptography
- Proof Request: Request and verify the proofs from agents to validate their credentials.


### Endpoints

#### GET /ping

This endpoint returns a "pong" message to confirm that the agent API server is running.

**Response:**

Returns a string "pong".

#### GET /invitation

This endpoint creates an out-of-band invitation for another agent to connect.

**Query parameters:**

- `alias` (string, optional) - An alias for the invitation. Default is "user".

**Response:**

Returns a URL containing the out-of-band invitation information.

#### GET /connections

This endpoint retrieves all completed connections of the agent.

**Response:**

Returns an array of connection records that are in the `Completed` state.

#### GET /proofs

This endpoint retrieves all proofs of the agent.

**Response:**

Returns an array of proof records along with their associated tags.

#### GET /proofs/:proofId

This endpoint retrieves a specific proof by its unique ID.

**Path parameters:**

- `proofId` (string) - The unique identifier of the proof.

**Response:**

Returns the proof record along with its associated tags and presentation message.

#### GET /request-proof

This endpoint sends a proof request to a specific connection.

**Query parameters:**

- `connection_id` (string) - The unique identifier of the connection to which the proof request will be sent.
- `minAge` (string, optional) - The minimum age to request in the proof. Defaults to 18 if not specified.

**Response:**

Returns the proof request record.

#### GET /offer-credential

This endpoint sends a credential offer to a specific connection.

**Query parameters:**

- `connection_id` (string) - The unique identifier of the connection to which the credential offer will be sent.
- `name` (string, optional) - The name attribute to include in the offer. Default is "John".
- `age` (string, optional) - The age attribute to include in the offer. Default is "30".

**Response:**

Returns the credential offer record.





## Anoncreds API

The AnonCreds API is a server to manage schemas and credential definitions to be consumed by Issuers and holders to verify the schema.


### Features

- Schema Management: Create and manage schemas for verifiable credentials.
- Credential Definitions management: Define and manage the rules and standards for issuing credentials based on defined schemas.


### Endpoints

#### GET /schemas/:id

This endpoint retrieves a specific schema by its unique ID.

**Path parameters:**

- `id` (string) - The unique identifier of the schema.

**Response:**

Returns the schema object that matches the provided ID. If no schema is found, an empty response is returned.

#### GET /schemas

This endpoint retrieves all schemas, paginated by default.

**Query parameters:**

- `page` (string, optional) - The page number to retrieve. Defaults to "0".
- `take` (string, optional) - The number of schemas to retrieve per page. Defaults to "10".

**Response:**

Returns an array of schema objects for the specified page.

#### DELETE /all

This endpoint deletes all schemas and all credential definitions.

**Response:**

Returns a success message if the operation is completed successfully.

#### POST /schemas

This endpoint creates a new schema.

**Body parameters:**

- `name` (string) - The name of the schema.
- `version` (string) - The version of the schema.
- `attrNames` (string[]) - An array of attribute names for the schema.
- `issuerId` (string) - The unique identifier of the issuer.

**Response:**

Returns the created schema object.

#### GET /credentialDefinition/:id

This endpoint retrieves a specific credential definition by its unique ID.

**Path parameters:**

- `id` (string) - The unique identifier of the credential definition.

**Response:**

Returns the credential definition object that matches the provided ID. If no credential definition is found, an empty response is returned.

#### POST /credentialDefinition

This endpoint creates a new credential definition.

**Body parameters:**

- `schemaId` (string) - The unique identifier of the schema to which this credential definition belongs.
- `tag` (string) - A tag for the credential definition.
- `issuerId` (string) - The unique identifier of the issuer.
- `type` (string) - The type of the credential definition.
- `value` (any) - The value of the credential definition.

**Response:**

Returns the created credential definition object. If the provided schema ID does not exist, a 400 error is returned with an "Schema not found" message.


