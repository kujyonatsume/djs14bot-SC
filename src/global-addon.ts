import { randomInt } from 'crypto';
import { Emoji, Message } from 'discord.js';

declare global {
    var input: (q?: string) => Promise<string>
    interface Array<T> {
        groupBy(callback: (value: T, i: number) => PropertyKey): Partial<Record<PropertyKey, T[]>>
    }
    interface Math {
        randomInt: typeof randomInt
    }
    interface PromiseConstructor {
        delay(ms: number): Promise<void>
    }
}

globalThis.input = (q?: string) => {
    if (q) process.stdout.write(q)
    return new Promise<string>((res, reg) => process.stdin.once("data", data => res(`${data}`.trim())))
}

Math.randomInt = randomInt
Promise.delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
Array.prototype.groupBy = function <T>(this: T[], fn: (v: T, i: number) => PropertyKey) {
    return Object.groupBy(this, fn)
}

declare module "discord.js" {
    export interface EventFunc {
        init(): Awaited<Promise<any>>;
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
        messageCreate?(message: Message): Awaited<Promise<any>>;
        messageDelete?(message: Message | PartialMessage): Awaited<Promise<any>>;
        messageReactionAdd?(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Awaited<Promise<any>>;
        messageReactionRemove?(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Awaited<Promise<any>>;
        messageUpdate?(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Awaited<Promise<any>>;
        userUpdate?(oldUser: User | PartialUser, newUser: User): Awaited<Promise<any>>;
        voiceStateUpdate?(oldState: VoiceState, newState: VoiceState): Awaited<Promise<any>>;
    }
    export interface Message {
        emojiParse(): void;
        emojis: Emoji[];
    }
}
