import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonComponent, Client, Collection, ColorResolvable, ComponentType, Interaction, InteractionReplyOptions, MessageActionRowComponent, MessagePayload } from "discord.js";
import * as AppModule from "./Commands";
import { commands, IOption, count, OptionAnd, Module, buttons } from "./decorator";

import { CommandInteraction, EmbedBuilder } from "discord.js";
import { db } from "./db";


export interface Metadata {
    interaction: CommandInteraction<"cached">;
    // Example for strict typing
}



const modules = new Collection<string, Module>()

export const client = new Client({ intents: 3276799 })

export async function DiscordStart(token: string, guildId?: string) {
    client.login(token)
    return client.on("ready", async c => {
        for (const [key, Mod] of Object.entries(AppModule)) {
            const mod = new Mod()
            modules.set(key.toLowerCase(), mod)
            await mod.init()
        }
        let size = (await c.application.commands.set((commands as any).filter((x: { only: any; }) => !x.only))).size
        if (c.guilds.cache.has(guildId))
            size += (await c.application.commands.set((commands as any).filter((x: { only: any; }) => x.only), guildId)).size
        console.log(`已註冊 ${size} 個模組 總共 ${count} 個指令`)

        console.log(`${c.user.username} 初始化完成`)
        c.on('messageCreate', async message => {
            if (message.author.bot) return
            for (const [name, mod] of modules) {
                if (mod.messageCreate) await mod.messageCreate.call(mod, message)
            }
        })

        c.on("interactionCreate", async interaction => {

            if (interaction.isAutocomplete()) {
                const { module, subOptions } = await isCommand(interaction)
                const data = (interaction.options as any).getFocused(true)
                const options = await subOptions.find(x => x.name === data.name).exec(module, interaction, data.value)
                await interaction.respond(options)
                return
            }

            if (interaction.isChatInputCommand()) {
                const { module, command, subOptions } = await isCommand(interaction)
                try {
                    let line = `${interaction.user.displayName} ${command.orgName}`
                    console.log()
                    console.log(`\n${new Date().toLocaleTimeString()}[command start] ${interaction.commandName} ${line}`);

                    module.i = interaction
                    let options = subOptions.map((x => {
                        let d = interaction.options.get(x.name);
                        return x.name, d ? d[x.parse] || d.value : null
                    }))

                    console.log(`${interaction.commandName} ${options.join(" ")}`);

                    await module[command.orgName](...options)
                    console.log(`[command end]  ${interaction.commandName} ${line}`);
                } catch (e) { console.log(e); }
                return
            }
        })

        async function isCommand(interaction: Interaction) {
            if (interaction.isAutocomplete() || interaction.isChatInputCommand()) {

                let command = commands.find(x => x.name === interaction.commandName) as OptionAnd
                const sub = interaction.options.getSubcommand(false)
                if (sub) {
                    const group = interaction.options.getSubcommandGroup(false)
                    if (group)
                        command = (<any>command.options as IOption[]).find(x => x.name == group) as OptionAnd
                    command = (<any>command.options as IOption[]).find(x => x.name == sub) as OptionAnd
                }
                return {
                    subOptions: (<any>command.options as IOption[]),
                    module: modules.get(command.className.toLowerCase()),
                    command
                }
            }
        }
        c.on("guildCreate", async guild => {
            try {
                console.log("加入伺服器: " + guild.name)
            } catch (e) {
                console.log(e);
            }
        })
    })
}