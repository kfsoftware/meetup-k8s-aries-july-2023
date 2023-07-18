import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AnonCredsSchema {
    @PrimaryColumn("varchar")
    id: string;

    @Column()
    name: string;

    @Column()
    version: string;

    @Column("simple-json", { array: true })
    attributes: string[];

    @Column()
    issuerId: string;

    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;


    @OneToMany(() => AnonCredsCredentialDefinition, (credDef) => credDef.schema)
    credDefs: AnonCredsCredentialDefinition[]
}


@Entity()
export class AnonCredsCredentialDefinition {
    @PrimaryColumn("varchar")
    id: string;

    @ManyToOne(type => AnonCredsSchema, schema => schema.credDefs)
    schema: AnonCredsSchema;

    @Column()
    tag: string;

    @Column()
    issuerId: string;

    @Column()
    type: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column("simple-json")
    value: any;
}
