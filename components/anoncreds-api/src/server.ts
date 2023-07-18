import "reflect-metadata";
import { DataSource } from 'typeorm';
import express from 'express';
import { AddressInfo } from "net"
import { Logger } from "tslog"
import { v5 as uuidv5 } from "uuid";
import cors from 'cors';
const log = new Logger();
import * as dbModels from './models';
const UUID_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";
const port = process.env.PORT || 3554;
async function main() {
    const dataSource = new DataSource({
        type: "sqlite",
        entities: [
            dbModels.AnonCredsCredentialDefinition,
            dbModels.AnonCredsSchema,
        ],
        database: "db.sqlite",
        synchronize: true,
    })
    await dataSource.initialize();
    const schemaRepository = dataSource.getRepository(dbModels.AnonCredsSchema);
    const credDefRepository = dataSource.getRepository(dbModels.AnonCredsCredentialDefinition);
    const app = express();
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cors())
    const router = express.Router();
    router.get('/schemas/:id', async (req, res) => {
        log.info('Getting schema', req.params.id);
        const schema = await schemaRepository.findOne({
            where: {
                id: req.params.id
            }
        });
        res.json(schema);
    });

    router.get('/schemas', async (req, res) => {
        log.info('Getting all schemas');
        const { page = "0", take = "10" } = req.query;
        const data = await schemaRepository.find({
            skip: parseInt(page as string) * parseInt(take as string),
            take: take ? parseInt(take as string) : 10,
        });
        res.json(data);
    });

    router.delete('/all', async (req, res) => {
        log.info('Deleting all schemas');
        await schemaRepository.clear();
        await credDefRepository.clear();
        res.json({ success: true });
    })
    router.post('/schemas', async (req, res) => {
        log.info('Registering schema', req.body);
        const schemaInput = req.body as {
            name: string,
            version: string,
            attrNames: string[],
            issuerId: string,
        }
        const schemaID = `urn:${uuidv5(JSON.stringify(req.body) + Date.now(), UUID_NAMESPACE)}`;
        const schema = await schemaRepository.save({
            id: schemaID,
            attributes: schemaInput.attrNames,
            credDefs: [],
            issuerId: schemaInput.issuerId,
            name: schemaInput.name,
            version: schemaInput.version,
        });
        res.json(schema);
    });

    router.get('/credentialDefinition/:id', async (req, res) => {
        log.info('Getting credential definition', req.params.id);
        const credDef = await credDefRepository.findOne({
            where: { id: req.params.id },
            relations: ['schema']
        });
        res.json({
            ...credDef,
            // schema: await schemaRepository.findOneBy({ id: credDef.schema.id })
        });
    });

    router.post('/credentialDefinition', async (req, res) => {
        log.info('Registering credential definition', req.body);
        const credDefInput = req.body as {
            schemaId: string,
            tag: string,
            issuerId: string,
            type: string,
            value: any,
        }
        const schema = await schemaRepository.findOneBy({ id: credDefInput.schemaId })
        if (!schema) {
            res.status(400).json({ error: 'Schema not found' });
            return;
        }
        const credDefID = `urn:${uuidv5(JSON.stringify(credDefInput) + Date.now(), UUID_NAMESPACE)}`;
        const credDef = await credDefRepository.save({
            id: credDefID,
            schema: schema,
            type: credDefInput.type,
            tag: credDefInput.tag,
            value: credDefInput.value,
            issuerId: credDefInput.issuerId,
        });
        res.json(credDef);
    });
    app.use(router);
    const server = app.listen(port, () => {
        const address = server.address() as AddressInfo;
        console.log(`Listening on ${address.address}${address.port}`)
    })
}
void main();
