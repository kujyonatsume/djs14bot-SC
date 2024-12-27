import { client } from "../discord";
import { Button, Group, Module, Option, SubCommand, SubGroup } from "../decorator";
import { AutocompleteInteraction, ChannelType, EmbedBuilder, GuildMember, inlineCode, TextChannel } from "discord.js";
import { db } from "../db";
import { ChatType, YoutubeChat } from "../service";
import config from "../config";
const live = new YoutubeChat('zh')
const Capture = SubGroup({ name: "capture", local: "擷取" })

@Group({ name: 'chat', local: "聊天室", permission: "Administrator" })
export class LiveChat extends Module {
    async init() {
        setTimeout(this.Timer, 1)
    }
    async Timer() {
        while (true) {
            try {
                await Promise.delay(config.min * 10 * 1000)
                const Users = await db.YoutubeUser.findBy({ streaming: false })
                for (const user of Users) {
                    const html = await (await fetch(`${user.url}/live`)).text() as string;
                    const videoId = html.match(/<link rel="canonical" href="(?:.*?)v=(.*?)">/)?.[1]
                    if (!videoId) continue
                    user.streaming = true
                    await user.save()
                    setTimeout(async () => await this.SendLiveChat(user), 1)
                }
            }
            catch (e) {
                console.log(new Date().toLocaleString());
                console.log(e)
                console.log("\n");
            }
        }
    }
    async SendLiveChat(user: db.YoutubeUser) {
        console.log(user.name + "is Streaming");
        await live.LiveChatMessage(user.id, (msg) => {
            for (const capture of user.captures) {
                if (msg.type != ChatType.ChatSuperChat && !capture.targets.find(x => x.id == msg.channelID)) continue
                const channel = client.channels.cache.get(capture.id)
                if (channel?.isSendable()) channel.send({
                    embeds: [
                        new EmbedBuilder().setAuthor({ name: msg.name, iconURL: msg.avatarUrl })
                            .setDescription(msg.content)
                            .setFields({ name: "金額", value: msg.purchaseAmountText })
                            .setFooter({ text: msg.timestampText })
                    ]
                })
            }
        })
        user.streaming = false
        await user.save()
    }

    @Capture({ local: "建立", desc: "新增聊天室爬蟲" })
    async create(@Option({ local: "youtube頻道", description: "YT頻道網址" }) url: string,
        @Option({ local: "通知頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel) {
        const data = await live.getChannel(url)
        if (!data) return await this.ErrorEmbed(`不支援的網址 請確認是否輸入為youtube頻道網址`, true)
        let user = await db.YoutubeUser.findOneBy({ id: data.id }) ?? await db.YoutubeUser.save({ ...data })
        let cap = user.captures?.find(x => x.guildid == channel.guildId)
        if (cap) return await this.ErrorEmbed(`伺服器已存在此爬蟲, 如果要修改頻道請使用 ${inlineCode("/chat capture update")}`, true)
        cap = db.Capture.create({ id: channel.id, guildid: channel.guildId })
        cap.user = Promise.resolve(user)
        await cap.save()
        return await this.SuccessEmbed(`已加入爬蟲 ${inlineCode(data.id)}`, true)
    }
    @Capture({ local: "更新", desc: "新增聊天室爬蟲" })
    async update(@Option({ local: "聊天室爬蟲", description: "選擇爬蟲", exec: LiveChat.getCapture }) capture: string,
        @Option({ local: "通知頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel) {
        const user = await db.YoutubeUser.findOneBy({ id: capture })
        let cap = user.captures.find(x => x.guildid == channel.guildId)
        if (!cap) return await this.ErrorEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/chat capture create")}`, true)
        cap.id = channel.id
        await cap.save()
        return await this.SuccessEmbed(`通知頻道更新至 ${channel}`, true)
    }
    static async getCapture(mod: Module, i: AutocompleteInteraction, current: string) {
        const captures = (await Promise.all((await db.Capture.findBy({ guildid: i.guildId })).map(x => x.user))).map(x => ({ name: x.name, value: x.id }))
        if (captures.length > 10) captures.length = 10
        return captures
    }
    @Capture({ local: "擷取使用者", desc: "擷取其他使用者" })
    async addtarget(
        @Option({ local: "聊天室爬蟲", description: "選擇爬蟲", exec: LiveChat.getCapture }) capture: string,
        @Option({ local: "youtube頻道", description: "避免使用者名稱重複請輸入頻道網址或@username" }) url: string
    ) {
        const cap = (await db.YoutubeUser.findOneBy({ id: capture }))?.captures.find(x => x.guildid == this.i.guildId)
        if (!cap)
            return await this.ErrorEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/chat capture create")}`, true)

        const data = await live.getChannel(url)
        
        if (!data)
            return await this.ErrorEmbed(`不支援的網址 請確認是否輸入為youtube頻道網址`, true)

        if (!await db.UserTarget.existsBy({ id: data.id })){
            const target = db.UserTarget.create({ ...data })
            target.capture = Promise.resolve(cap)
            await target.save()
            console.log("UserTarget add");
        }

        return await this.SuccessEmbed(`Id: ${inlineCode(data.name)} 已加入擷取範圍`, false)
    }
    @Capture({ local: "移除擷取", desc: "擷取其他使用者" })
    async deltarget(
        @Option({ local: "聊天室爬蟲", description: "選擇爬蟲", exec: LiveChat.getCapture }) capture: string,
        @Option({ local: "頻道", description: "避免使用者名稱重複請輸入頻道網址或@username", exec: LiveChat.getTarget }) target: string
    ) {
        const cap = (await db.YoutubeUser.findOneBy({ id: capture }))?.captures.find(x => x.guildid == this.i.guildId)
        if (!cap)
            return await this.ErrorEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/chat capture create")}`, true)

        const user = await cap.targets.find(x => x.id == target)?.remove()

        return await this.SuccessEmbed(`Id: ${inlineCode(user.id)} 已移出擷取範圍`, false)
    }
    static async getTarget(mod: Module, i: AutocompleteInteraction, current: string) {
        const captures = (await db.YoutubeUser.findOneBy({ id: i.options.getString("capture") }))?.captures.find(x => x.guildid == i.guildId).targets
            .filter(x => x.name.startsWith(current) || x.id.startsWith(current)).map(x => ({ name: x.name, value: x.id })) ?? []
        if (captures.length > 10) captures.length = 10
        return captures
    }
}