import "reflect-metadata"
import "../src/global-addon"

import {
    ChannelType as CT,
    SlashCommandBuilder as SlashBuilder,
    SlashCommandSubcommandBuilder as _SB,
    SlashCommandSubcommandGroupBuilder as SubGroupBuilder,
    SharedNameAndDescription as CmdShared,
    APIApplicationCommandOptionChoice as Choice,
    SlashCommandAttachmentOption as AO,
    SlashCommandBooleanOption as BO,
    SlashCommandChannelOption as CO,
    SlashCommandNumberOption as NO,
    SlashCommandRoleOption as RO,
    SlashCommandStringOption as SO,
    SlashCommandUserOption as UO,
    LocalizationMap as LocalMap,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessagePayload,
    PermissionsBitField,
    PermissionResolvable,
    InteractionReplyOptions,
    APIEmbed,
    Message,
    ColorResolvable,
    Guild,
    GuildBan,
    GuildMember,
    Interaction,
    Invite,
    MessageReaction,
    OmitPartialGroupDMChannel,
    PartialGuildMember,
    PartialMessage,
    PartialMessageReaction,
    PartialUser,
    User,
    VoiceState,
    ButtonBuilder,
    ButtonStyle,
    ButtonComponent
} from "discord.js";

interface IGroup { name: string, local?: string }
export class SubBuilder extends _SB { constructor(public group?: IGroup) { super(); } }
export { SlashBuilder, SubGroupBuilder }
export type OptionAnd<T = SlashBuilder | SubGroupBuilder | SubBuilder> = IOption & T
var subs: SubBuilder[] = []
var opts: { set(name: string): IOption }[] = []
const dType = { attachment: AO, boolean: BO, channel: CO, number: NO, role: RO, string: SO, user: UO, member: UO }
type Button = ButtonBuilder & { update?(x: ButtonComponent): ButtonComponent }
export var count = 0
export var commands: SlashBuilder[] = []
export var buttons: Record<string, Button> = {}
type OptionType = keyof typeof dType
type Constructor<T = any> = Function & { new(...args: any[]): T };
type AllowChannel = Exclude<CT, CT.DM | CT.GroupDM | CT.GuildDirectory>
type CompleteFunc = (mod: Module, i: AutocompleteInteraction, current: string | number) => Promise<Choice<string | number>[]>

export class Module {
    async init() { }
    debug?(message: string): Awaited<Promise<any>>;
    warn?(message: string): Awaited<Promise<any>>;
    error?(error: Error): Awaited<Promise<any>>;
    guildBanAdd?(ban: GuildBan): Awaited<Promise<any>>;
    guildBanRemove?(ban: GuildBan): Awaited<Promise<any>>;
    guildCreate?(guild: Guild): Awaited<Promise<any>>;
    guildDelete?(guild: Guild): Awaited<Promise<any>>;
    guildMemberAdd?(member: GuildMember): Awaited<Promise<any>>;
    guildMemberAvailable?(member: GuildMember | PartialGuildMember): Awaited<Promise<any>>;
    guildMemberRemove?(member: GuildMember | PartialGuildMember): Awaited<Promise<any>>;
    guildMemberUpdate?(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Awaited<Promise<any>>;
    interactionCreate?(interaction: Interaction): Awaited<Promise<any>>;
    inviteCreate?(invite: Invite): Awaited<Promise<any>>;
    messageCreate?(message: OmitPartialGroupDMChannel<Message<boolean>>): Awaited<Promise<any>>;
    messageDelete?(message: Message | PartialMessage): Awaited<Promise<any>>;
    messageReactionAdd?(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Awaited<Promise<any>>;
    messageReactionRemove?(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Awaited<Promise<any>>;
    messageUpdate?(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Awaited<Promise<any>>;
    userUpdate?(oldUser: User | PartialUser, newUser: User): Awaited<Promise<any>>;
    voiceStateUpdate?(oldState: VoiceState, newState: VoiceState): Awaited<Promise<any>>;
    public i: ChatInputCommandInteraction
    get isOwner() { return this.i.user.id == this.i.client.application.owner.id }
    get Embed() {
        return new EmbedBuilder()
    }

    SuccessEmbed(desc: string, ephemeral?: boolean): Promise<Message<boolean>>
    SuccessEmbed(embed: APIEmbed | EmbedBuilder, ephemeral?: boolean): Promise<Message<boolean>>
    SuccessEmbed(render: (embed: EmbedBuilder) => EmbedBuilder, ephemeral?: boolean): Promise<Message<boolean>>
    SuccessEmbed(data: any, ephemeral: boolean): Promise<Message<boolean>> {
        return this.sendEmbed(data, "Green", ephemeral)
    }

    ErrorEmbed(desc: string, ephemeral?: boolean): Promise<Message<boolean>>
    ErrorEmbed(embed: APIEmbed | EmbedBuilder, ephemeral?: boolean): Promise<Message<boolean>>
    ErrorEmbed(render: (embed: EmbedBuilder) => EmbedBuilder, ephemeral?: boolean): Promise<Message<boolean>>
    ErrorEmbed(data: any, ephemeral: boolean) {
        return this.sendEmbed(data, "DarkRed", ephemeral)
    }

    sendEmbed(desc: string, color: ColorResolvable, ephemeral?: boolean): Promise<Message<boolean>>
    sendEmbed(embed: APIEmbed | EmbedBuilder, color: ColorResolvable, ephemeral?: boolean): Promise<Message<boolean>>
    sendEmbed(render: (embed: EmbedBuilder) => EmbedBuilder, color: ColorResolvable, ephemeral?: boolean): Promise<Message<boolean>>
    sendEmbed(data: any, color: ColorResolvable, ephemeral?: boolean): Promise<Message<boolean>> {
        if (typeof data == "function")
            data = data(this.Embed)
        else if (typeof data == "string")
            data = this.Embed.setDescription(data)
        else if (!(data instanceof EmbedBuilder))
            data = EmbedBuilder.from(data);
        if (!(data as EmbedBuilder).data.color) data.setColor(color)
        return this.send({ embeds: [data], ephemeral })
    }
    async send(options: string | MessagePayload | InteractionReplyOptions) {
        if (this.i.deferred)
            return await this.i.editReply(options)

        if (this.i.replied)
            return await this.i.followUp(options)

        const x = await this.i.reply(options);
        return await x.fetch();
    }

}

export interface IOption {
    className: string
    orgName: string

    local?: string
    parse: OptionType
    exec: CompleteFunc

    name: string
    name_localizations?: LocalMap
    description: string
    description_localizations?: LocalMap

    required: boolean
    autocomplete?: boolean

    choices?: Choice<string | number>[]
    channel_types?: AllowChannel[]

    max_length?: number
    min_length?: number
    max_value?: number
    min_value?: number

    options?: IOption[]
}

export interface Named {
    name: string
    local: string
    desc: string
}

export interface CmdPerm {
    only?: boolean
    permission: PermissionResolvable
    nsfw: boolean
    dm: boolean
}

export function SubGroup(group: IGroup) {
    return (data: Partial<Named> = {}) => SubCommand({ ...data, group })
}

export function Option(data: Partial<IOption> = {}) {
    return function (target: any, key: string, index: number) {
        const ParamsType = Reflect.getMetadata("design:paramtypes", target, key) as (Function & { value: IOption })[] // ParamType is constructor Function
        data.autocomplete = typeof data.exec == 'function'
        if (!data.parse) {
            let type = ParamsType[index].name.toLowerCase()
            if (type.includes("channel")) type = "channel"
            if (!(type in dType)) throw new Error(`${key}() param:${index} type ${type} not in OptionType`)
            data.parse ??= type as OptionType
        }
        opts.unshift({ set: (name: string) => Create(new dType[data.parse]().setRequired(data.required ?? true), name, data) })
    }
}

function Create<T extends CmdShared>(data: T, orgName: string, o: Partial<Named>, className?: string): T & IOption {
    if (o.local) data.setNameLocalization("zh-TW", o.local)
    return Object.assign(data.setName((o.name ?? orgName).toLowerCase()).setDescription(o.desc ?? "..."), { ...o, orgName, className } as IOption)
}

function CreateCmd<T extends CmdShared>(target: Module, key: string, data: T, o: Partial<Named>) {
    const cmd = Create(data, key, o, target.constructor.name)
    if (opts.length > 0) {
        const options = `${target[key]}`.split("\n")[0].split(/\(|,|\)/).slice(1, -1).map(x => x.trim()).map((name, i) => opts[i].set(name))
        cmd.options.push(...options)
    }
    return cmd
}

export function Command(o: Partial<Named & CmdPerm> = {}) {
    return (target: Module, key: string, descriptor: PropertyDescriptor) => {
        commands.push(usePerm(CreateCmd(target, key, new SlashBuilder(), o), o))
        opts = []
        descriptor.enumerable = true
        return descriptor
    }
}

export function Button(style: keyof typeof ButtonStyle, o?: (x: Button) => Button) {
    return (target: Module, key: string, descriptor: PropertyDescriptor) => {
        const name = `${target.constructor.name.toLowerCase()}:${key}`
        let btn = new ButtonBuilder().setCustomId(name).setStyle(ButtonStyle[style])
        buttons[name] = o ? o(btn) : btn
        descriptor.enumerable = true
        return descriptor
    }
}

export function SubCommand(o: Partial<Named & { group?: IGroup }> = {}) {
    return (target: Module, key: string, descriptor: PropertyDescriptor) => {
        subs.push(CreateCmd(target, key, new SubBuilder(o.group), o))
        opts = []
        descriptor.enumerable = true
        return descriptor
    }
}

function usePerm<T extends SlashBuilder>(slash: T, o: Partial<CmdPerm>) {
    if (o.permission) slash.setDefaultMemberPermissions(new PermissionsBitField(o.permission).bitfield)
    return Object.assign(slash.setNSFW(Boolean(o.nsfw)).setContexts(0, 1), { only: Boolean(o.only) })
}

export function Group(o: Partial<Named & CmdPerm> = {}) {
    return (target: Constructor<Module>) => {
        if (subs.length == 0) return
        const slash = Create(new SlashBuilder(), target.name, o)
        for (const [name, sub] of Object.entries(Object.groupBy(subs, x => x.group?.name ?? "0"))) {
            if (name != "0") {
                const group = Create(new SubGroupBuilder(), name, sub[0].group)
                count += group.options.push(...sub)
                slash.options.push(group)
            } else count += slash.options.push(...sub)
        }
        commands.push(usePerm(slash, o))
        subs = []
    }
}

