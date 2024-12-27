import './global-addon'
import { DiscordStart } from './discord';
import config from "./config";
import { DatabaseInit } from './db';
Main()
async function Main() {
    await DatabaseInit()
    DiscordStart(config.token)
}
