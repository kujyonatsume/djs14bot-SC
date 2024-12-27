import "reflect-metadata"
import { BaseEntity, DataSource } from "typeorm"

export const orm = new DataSource({
    type: "better-sqlite3",
    database: "./data/database.db",
    synchronize: true,
    logging: false,
    entities: ['src/db/entity/*.ts'],
    subscribers: [],
})

export async function DatabaseInit() {
    await orm.initialize()
    await orm.runMigrations()
    BaseEntity.useDataSource(orm)
}