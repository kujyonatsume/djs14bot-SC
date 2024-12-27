import { client } from "../discord";
import { Button, Group, Module, Option, SubCommand, SubGroup } from "../decorator";
import { AutocompleteInteraction, ChannelType, EmbedBuilder, GuildMember, inlineCode, TextChannel } from "discord.js";
import { db } from "../db";
import { YoutubeChat } from "../service";
import config from "../config";
const live = new YoutubeChat('zh')
const Capture = SubGroup({ name: "capture", local: "擷取" })

@Group({ name: 'chat', local: "聊天室" })
export class LiveChat extends Module {

    async Timer() {

        while (true) {
            try {
                await Promise.delay(config.min * 60 * 1000)
                const Users = await db.YoutubeUser.findBy({ streaming: false })
                for (const user of Users) {
                    const html = await (await fetch(`${user.url}/live`)).text() as string;
                    const videoId = html.match(/<link rel="canonical" href="(?:.*?)v=(.*?)">/)?.[1]
                    if (videoId) {
                        user.streaming = true
                        await user.save()
                        setTimeout(async () => await this.SendLiveChat(videoId, user), 0)
                    }
                }
            }
            catch (e) {
                console.log(new Date().toLocaleString());
                console.log(e)
                console.log("\n");
            }
        }
    }
    async SendLiveChat(videoId: string, user: db.YoutubeUser) {

        await live.LiveChatMessage(user.id, (videoId, msg) => {
            for (const capture of user.captures) {
                const channel = client.channels.cache.find(x => x.id == capture.id) as TextChannel
                if (channel) channel.send({
                    embeds: [
                        new EmbedBuilder().setAuthor({ name: msg.name, iconURL: msg.avatarUrl })
                            .setTitle(msg.type)
                            .setDescription(msg.content)
                            .setFooter({ text: msg.timestampText })
                    ]
                })
            }
        })
        user.streaming = false
        await user.save()
    }

    @Capture({ local: "建立", desc: "新增聊天室爬蟲" })
    async create(@Option({ local: "頻道", description: "YT頻道網址" }) url: string,
        @Option({ local: "設定頻道", channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] }) channel: TextChannel) {
        const data = await live.getChannel(url)
        if (!data) return await this.SuccessEmbed(`不支援的網址 請確認是否輸入為youtube頻道網址`, true)
        let user = await db.YoutubeUser.findOneBy({ id: data.id })
        if (!user) user = db.YoutubeUser.create({ ...data })
        let cap = user.captures.find(x => x.guildid == channel.guildId)
        if (cap) return await this.SuccessEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/twitter capture create")}`, true)
        cap = db.Capture.create({ id: channel.id })
        user.captures.push(cap)
        await user.save()
        return await this.SuccessEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/twitter notify create")}`, true)
    }
    //  static async getCapture(mod: Module, i: AutocompleteInteraction, current: string) {
    //      let users = []
    //      for (const capture of await db.Capture.findBy({ guildid: i.guildId })) {
    //          const { name, id } = await capture.user
    //          if (name.startsWith(current)) users.push({ name, value:id })
    //      }
    //      return users
    //  }
    //  @Capture({ local: "新增目標", desc: "擷取其他使用者" })
    //  async addtarget(
    //      @Option({ local: "聊天室爬蟲", exec: LiveChat.getCapture }) id: string,
    //      @Option({ local: "YT頻道", description: "避免使用者名稱重複使用頻道ID擷取" }) url: string
    //  ) {
    //      const data = await live.getChannel(url)
    //      if (!data) return await this.SuccessEmbed(`不支援的網址 請確認是否輸入為youtube頻道網址`, true)
    //      return await this.SuccessEmbed(`伺服器不存在此爬蟲, 如果要新增請使用 ${inlineCode("/twitter notify create")}`, false)
    //  }
}