const langs = {
    en: { gl: "US", hl: "en" },
    zh: { gl: "TW", hl: "zh-TW" },
    jp: { gl: "JP", hl: "ja" },
    kr: { gl: "KR", hl: "ko" }
}
export enum ChatType {
    System = "System",
    ChatGeneral = "ChatGeneral",
    ChatSuperChat = "ChatSuperChat",
    ChatSuperSticker = "ChatSuperSticker",
    ChatJoinMember = "ChatJoinMember",
    ChatMemberUpgrade = "ChatMemberUpgrade",
    ChatMemberMilestone = "ChatMemberMilestone",
    ChatMemberGift = "ChatMemberGift",
    ChatReceivedMemberGift = "ChatReceivedMemberGift",
    ChatRedirect = "ChatRedirect",
    ChatPinned = "ChatPinned",
    MemberUpgrade = "MemberUpgrade",
    MemberMilestone = "MemberMilestone",
}
const ChatMap = {
    "liveChatViewerEngagementMessageRenderer": ChatType.System,
    "liveChatModeChangeMessageRenderer": ChatType.System,
    "liveChatTextMessageRenderer": ChatType.ChatGeneral,
    "liveChatPaidMessageRenderer": ChatType.ChatSuperChat,
    "liveChatPaidStickerRenderer": ChatType.ChatSuperSticker,
    "liveChatMembershipItemRenderer": ChatType.ChatJoinMember,
    "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer": ChatType.ChatMemberGift,
    "liveChatSponsorshipsGiftRedemptionAnnouncementRenderer": ChatType.ChatReceivedMemberGift,
    "liveChatBannerHeaderRenderer": ChatType.ChatPinned,
    "liveChatBannerRedirectRenderer": ChatType.ChatRedirect,
}
const Localize = {
    en: { MemberUpgrade: "Upgraded membership to", MemberMilestone: "Member for" },
    zh: { MemberUpgrade: "頻道會員等級已升級至", MemberMilestone: "已加入會員", },
    jp: { MemberUpgrade: "にアップグレードされました", MemberMilestone: "メンバー歴", },
    kr: { MemberUpgrade: "멤버십을", MemberMilestone: "회원 가입 기간", }
}

//#region YTDataType
class Message {
    /** 訊息類型 */
    type?: ChatType;
    /** 使用者頻道ID */
    channelID?: string;
    /** 使用者名稱 */
    name?: string;
    /** 使用者相片影像檔網址 */
    avatarUrl?: string;
    /** 使用者徽章（文字） */
    authorBadges?: string;
    /** 訊息內容 */
    content?: string;
    /** 購買金額（文字格式） */
    purchaseAmountText?: string;
    /** 前景顏色（Hex 色碼） */
    foregroundColor?: string;
    /** 背景顏色（Hex 色碼） */
    backgroundColor?: string;
    /** 時間標記（Unix 秒數） */
    timestampUsec?: number;
    /** 時間標記（文字格式）*/
    timestampText?: string;
    /** 列表：Sticker 資料 */
    stickers?: StickerData[];
    /** Emoji 資料 */
    emojis?: EmojiData[];
    /** 徽章資料 */
    badges?: BadgeData[];
}

class AuthorBadgesData {
    /** 文字 */
    text?: string;
    /** 列表：徽章資料 */
    badges?: BadgeData[];
}

class BadgeData {
    /** 工具提示 */
    tooltip?: string;
    /** 標籤 */
    label?: string;
    /** 圖示類型 */
    iconType?: string;
    /** 影像檔的網址 */
    url?: string;
}

class EmojiData {
    /** Emoji 的 ID 值*/
    id?: string;
    /** 影像檔的網址*/
    url?: string;
    /** 文字 */
    text?: string;
    /**標籤 */
    label?: string;
    /** 是否為自定義表情符號 */
    isCustomEmoji: boolean = false
}

class MessageData {
    /** 文字 */
    text?: string;
    /** 是否為粗體 */
    bold?: boolean;
    /** 文字顏色 */
    textColor?: string;
    /** 字型 */
    fontFace?: string;
    /** Sticker 資料 */
    stickers?: StickerData[];
    /** Emoji 資料 */
    emojis?: EmojiData[];
}

class StickerData {
    /** Sticker 的 ID 值 */
    id?: string;
    /** 影像檔的網址 */
    url?: string;
    /** 文字 */
    text?: string;
    /** 標籤 */
    label?: string;
}

class RunsData {
    /** 文字 */
    text?: string;
    /** 是否為粗體 */
    bold?: boolean;
    /** 文字顏色 */
    textColor?: string;
    /** 字型 */
    fontFace?: string;
    /** 列表：Emoji 資料 */
    emojis?: EmojiData[];
    /** 網址 */
    url?: string;
}
//#endregion

class YoutubeChat {
    //#region YTDataParser
    private ParseActions(jsonElement?: any) {
        if (!jsonElement) return
        const output: Message[] = [];

        let actions = jsonElement?.continuationContents?.liveChatContinuation?.actions;

        if (!actions) {
            actions = jsonElement?.contents?.liveChatRenderer?.actions;
        }

        if (Array.isArray(actions)) {
            for (const singleAction of actions) {

                // Handle `addChatItemAction`.
                const item = singleAction?.addChatItemAction?.item;
                if (item) output.push(...this.parseRenderer(item));

                // Handle `addBannerToLiveChatCommand`.
                const singleBannerRenderer = singleAction?.addBannerToLiveChatCommand?.bannerRenderer;
                if (singleBannerRenderer) output.push(...this.parseRenderer(singleBannerRenderer));

                // Handle `videoOffsetTimeMsec`.
                const videoOffsetTimeMsec = singleAction?.addChatItemAction?.videoOffsetTimeMsec;
                const videoOffsetTimeText = this.getVideoOffsetTimeMsec(videoOffsetTimeMsec);

                // Handle `replayChatItemAction`.
                const replayActions = singleAction?.replayChatItemAction?.actions;

                if (Array.isArray(replayActions)) {
                    for (const replayAction of replayActions) {
                        const replayItem = replayAction?.addChatItemAction?.item;

                        if (replayItem) {
                            const rendererDatas = this.parseRenderer(replayItem);

                            rendererDatas.forEach((rendererData) => {
                                if (!rendererData.timestampText && !rendererData.timestampUsec) {
                                    rendererData.timestampText = videoOffsetTimeText;
                                }
                            });

                            output.push(...rendererDatas);
                        }

                        const replayBannerRenderer = replayAction?.addBannerToLiveChatCommand?.bannerRenderer;

                        if (replayBannerRenderer) {
                            const rendererDatas = this.parseRenderer(replayBannerRenderer);

                            rendererDatas.forEach((rendererData) => {
                                if (!rendererData.timestampText && !rendererData.timestampUsec) {
                                    rendererData.timestampText = videoOffsetTimeText;
                                }
                            });

                            output.push(...rendererDatas);
                        }
                    }
                }
            }
        }

        return output.filter(x => x.type);
    }

    private ParseContinuation(jsonElement?: any) {
        const output: [string, number] = [null, null];

        const continuations = jsonElement?.continuationContents?.liveChatContinuation?.continuations;

        if (Array.isArray(continuations)) {
            for (const singleContinuation of continuations) {
                const invalidationContinuationData = singleContinuation.invalidationContinuationData;
                if (invalidationContinuationData) {
                    const continuation = invalidationContinuationData.continuation;
                    if (continuation) {
                        output[0] = continuation;
                    }

                    const timeoutMs = invalidationContinuationData.timeoutMs;
                    if (timeoutMs) {
                        output[1] = timeoutMs;
                    }

                    break;
                }

                const timedContinuationData = singleContinuation.timedContinuationData;
                if (timedContinuationData) {
                    const continuation = timedContinuationData.continuation;
                    if (continuation) {
                        output[0] = continuation
                    }

                    const timeoutMs = timedContinuationData.timeoutMs;
                    if (timeoutMs) {
                        output[1] = timeoutMs
                    }

                    break;
                }

                const liveChatReplayContinuationData = singleContinuation.liveChatReplayContinuationData;
                if (liveChatReplayContinuationData) {
                    const continuation = liveChatReplayContinuationData.continuation;
                    if (continuation) {
                        output[0] = continuation
                    }

                    const timeUntilLastMessageMsec = liveChatReplayContinuationData.timeUntilLastMessageMsec;
                    if (timeUntilLastMessageMsec) {
                        output[1] = timeUntilLastMessageMsec
                    }
                    break;
                }
            }
        }

        return output;
    }

    private getVideoOffsetTimeMsec(jsonElement?: any) {
        const videoOffsetTimeMsec = jsonElement?.videoOffsetTimeMsec;

        if (!videoOffsetTimeMsec) return
        const milliseconds = Number(videoOffsetTimeMsec);

        // 將 Unix 毫秒時間轉換為 "HH:mm:ss" 格式
        const date = new Date(milliseconds);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    private parseRenderer(jsonElement?: any) {
        const output: Message[] = [];
        if ((
            this.setRendererData(output, jsonElement, "liveChatTextMessageRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatPaidMessageRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatPaidStickerRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatMembershipItemRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatViewerEngagementMessageRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatModeChangeMessageRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer") ||
            this.setRendererData(output, jsonElement, "liveChatSponsorshipsGiftRedemptionAnnouncementRenderer")
        )) return output

        const liveChatBannerRenderer = jsonElement?.liveChatBannerRenderer;

        if (this.setRendererData(output, liveChatBannerRenderer?.header, "liveChatBannerHeaderRenderer")) return output

        const contents = liveChatBannerRenderer?.contents;

        this.setRendererData(output, contents, "liveChatTextMessageRenderer") || this.setRendererData(output, contents, "liveChatBannerRedirectRenderer")

        return output;
    }

    private setRendererData(dataSet: Message[], jsonElement: any, rendererName: string) {
        if (!(jsonElement = jsonElement?.[rendererName])) return
        let data = new Message()
        const messageData = this.parseMessageData(jsonElement);
        data.type = ChatMap[rendererName]
        data.channelID = jsonElement?.authorExternalChannelId;
        data.name = this.getAuthorName(jsonElement);
        data.avatarUrl = this.getAuthorPhoto(jsonElement);
        data.authorBadges = this.parseAuthorBadges(jsonElement)?.text;
        data.content = messageData?.text;
        data.purchaseAmountText = jsonElement?.purchaseAmountText?.simpleText;
        data.foregroundColor = messageData?.textColor;
        data.backgroundColor = this.getColorHexCode(jsonElement?.backgroundColor ?? jsonElement?.bodyBackgroundColor)
        data.timestampUsec = Number(jsonElement?.timestampUsec)
        if (data.timestampUsec) data.timestampText = new Date(data.timestampUsec / 1000).toLocaleString()

        if (rendererName === "liveChatMembershipItemRenderer") {
            // Update type based on message content
            if (data.content.includes(Localize[this.lang].MemberUpgrade)) {
                data.type = ChatType.ChatMemberUpgrade
            } else if (data.content.includes(Localize[this.lang].MemberMilestone)) {
                data.type = ChatType.ChatMemberMilestone
            }
        } else if (rendererName === "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer") {
            const headerRenderer = jsonElement.header?.liveChatSponsorshipsHeaderRenderer;

            if (headerRenderer) {
                data.name = this.getAuthorName(headerRenderer);
                data.avatarUrl = this.getAuthorPhoto(headerRenderer);
                data.authorBadges = this.parseAuthorBadges(headerRenderer)?.text;
                data.content = this.parseMessageData(headerRenderer)?.text;
            }
        }

        dataSet.push(data)
        return true
    }

    private getAuthorName(jsonElement?: any): string {
        return jsonElement?.authorName?.simpleText;
    }

    private getAuthorPhoto(jsonElement?: any) {
        return this.getThumbnailUrl(jsonElement?.authorPhoto);
    }

    private parseAuthorBadges(jsonElement?: any) {
        const authorBadges = jsonElement?.authorBadges;
        if (!Array.isArray(authorBadges)) return
        const output = new AuthorBadgesData()
        const tempBadges: BadgeData[] = [];
        for (const singleAuthorBadge of authorBadges) {
            const badgeData = new BadgeData()
            badgeData.url = this.getThumbnailUrl(singleAuthorBadge?.liveChatAuthorBadgeRenderer?.customThumbnail);
            badgeData.iconType = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.icon?.iconType;
            badgeData.tooltip = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.tooltip;
            badgeData.label = singleAuthorBadge?.liveChatAuthorBadgeRenderer?.accessibility?.accessibilityData?.label;
            tempBadges.push(badgeData);
        }
        output.text = this.getBadgeName(tempBadges);
        output.badges = tempBadges;
        return output;
    }

    private getBadgeName(list: BadgeData[]) {
        var array = list.map(n => n.label);
        if (Array.isArray(array)) return array.join("、");
    }

    private parseMessageData(jsonElement?: any) {
        const output = new MessageData()
        let tempText = '';
        let tempTextColor = '';
        let tempFontFace = '';
        let isBold = false;
        const tempStickers: StickerData[] = [];
        const tempEmojis: EmojiData[] = [];

        function addRunData(runsData?: RunsData) {
            if (!runsData) return;
            tempText += runsData.text || '';
            isBold = runsData.bold || false;
            tempTextColor = runsData.textColor || '';
            tempFontFace = runsData.fontFace || '';
            if (runsData.emojis) tempEmojis.push(...runsData.emojis);
        };

        const headerPrimaryText = jsonElement?.headerPrimaryText;
        if (headerPrimaryText) {
            const runsData = this.parseRunData(headerPrimaryText);
            tempText += ` [${runsData.text}] `;
            addRunData(runsData);
        }

        const headerSubtext = jsonElement?.headerSubtext;
        if (headerSubtext) {
            const simpleText = headerSubtext?.simpleText;
            if (simpleText) tempText += ` [${simpleText}] `;
            const runsData = this.parseRunData(headerSubtext);
            if (runsData?.text) tempText += ` ${runsData.text} `;
            addRunData(runsData);
        }

        addRunData(this.parseRunData(jsonElement?.primaryText));
        addRunData(this.parseRunData(jsonElement?.text));
        addRunData(this.parseRunData(jsonElement?.subtext));

        const sticker = jsonElement?.sticker;
        if (sticker) {
            const stickerData = new StickerData()
            const label = sticker?.accessibility?.accessibilityData?.label;
            if (label) tempText += `:${label}:`;
            const content = jsonElement?.lowerBumper?.liveChatItemBumperViewModel?.content?.bumperUserEduContentViewModel?.text?.content;
            if (content) tempText += ` [${content}] `;
            stickerData.id = label || '';
            stickerData.url = this.getThumbnailUrl(sticker);
            stickerData.text = label ? `:${label}:` : '';
            stickerData.label = label || '';
            tempStickers.push(stickerData);
        }

        addRunData(this.parseRunData(jsonElement?.message));
        addRunData(this.parseRunData(jsonElement?.bannerMessage));

        output.text = tempText;
        output.bold = isBold;
        output.textColor = tempTextColor;
        output.fontFace = tempFontFace;
        output.stickers = tempStickers;
        output.emojis = tempEmojis;

        return output;
    }

    private parseRunData(jsonElement?: any) {
        const runs = jsonElement?.runs;
        if (!Array.isArray(runs)) return
        const output = new RunsData();
        let tempText = '';
        let tempTextColor = '';
        let tempFontFace = '';
        let isBold = false;
        const tempEmojis: EmojiData[] = [];

        for (const singleRun of runs) {
            const text = singleRun?.text;
            if (text) tempText += text;
            const bold = singleRun?.bold;
            if (bold) isBold = bold;
            const textColor = singleRun?.textColor;
            if (textColor) tempTextColor += this.getColorHexCode(textColor);
            const fontFace = singleRun?.fontFace;
            if (fontFace) tempFontFace += fontFace;
            const emoji = singleRun?.emoji;
            if (emoji) {
                const emojiData = new EmojiData()
                const emojiId = emoji?.emojiId;
                if (emojiId) emojiData.id = emojiId;
                emojiData.url = this.getThumbnailUrl(emoji?.image);
                const label = emoji?.image?.accessibility?.accessibilityData?.label;
                if (label) tempText += `:${label}:`;
                const shortcuts = emoji?.shortcuts;
                if (shortcuts?.length) emojiData.text = shortcuts[0];
                emojiData.label = label || '';
                emojiData.isCustomEmoji = emoji?.isCustomEmoji || false;
                tempEmojis.push(emojiData);
            }
        }

        output.text = tempText;
        output.bold = isBold;
        output.textColor = tempTextColor;
        output.fontFace = tempFontFace;
        output.emojis = tempEmojis;


        return output;
    }

    private getThumbnailUrl(jsonElement?: any) {
        const thumbnails = jsonElement?.thumbnails;
        if (Array.isArray(thumbnails) && thumbnails.length > 0) {
            const url = thumbnails[0]?.url.split('=')[0]
            if (url?.startsWith('//')) return `https:${url}`;
            return url
        }
    }

    private getColorHexCode(color?: number) {
        if (color) return `#${color.toString(16).padStart(6, '0')}`;
    }
    //#endregion

    constructor(public readonly lang: keyof typeof Localize) { }
    async getChannel(input: string) {
        if (!input.startsWith("http")) {
            if (input.startsWith("UC") && input.length == 24) input = `https://www.youtube.com/channel/${input}`
            else if (input.startsWith("@")) input = `https://www.youtube.com/${input}`
        }

        const html = await (await fetch(input)).text() as string;
        const id = html.match(/<meta itemprop="identifier" content="(.*?)">/)?.[1]
        const name = html.match(/<meta itemprop="name" content="(.*?)">/)?.[1]
        console.log(id, name);
        
        if (id && name) return { id, name }

    }
    resloveStreamUrl(input: string) {
        input = input.replace(/https?:\/\/(?:www\.)?youtu\.?be(?:\.com)?\/(?:channel\/|embed\/|live\/|watch.*v=)?/, "").split(/\/|\?/)[0]
        if (!input) return
        if (input.startsWith("UC")) return `https://www.youtube.com/channel/${input}/live`
        if (input.startsWith("@")) return `https://www.youtube.com/${input}/live`
        if (input.length == 11) return `https://www.youtube.com/watch?v=${input}`
    }

    async LiveChatMessage(YouTubeURLorID: string, action: (message: Message) => any = (m) => console.log(`[${m.name}] ${m.content}`)) {
        var url = this.resloveStreamUrl(YouTubeURLorID)
        console.log(url);

        if (!url) return console.error(`NotYoutubeURL ${url}`);

        const html = await (await fetch(url)).text() as string;
        const videoId = html.match(/<link rel="canonical" href="(?:.*?)v=(.*?)">/)?.[1]
        if (!videoId || /LIVE_STREAM_OFFLINE/.test(html))
            return console.error('Not Streaming Now');

        let [apiKey, continuation] = [...html.matchAll(/"INNERTUBE_API_KEY":"(.*?)"|"continuation":"(.*?)"/g)].map(x => x[1] || x[2])
        if (!(apiKey && continuation))
            return console.error('Failed to fetch required parameters.');

        const chatUrl = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}`; // 替換為實際 API 密鑰

        while (true) {
            var data = await (await fetch(chatUrl, {
                method: "post", body: JSON.stringify({
                    context: { client: { clientName: "WEB", clientVersion: "2.20230228.00.00", ...langs[this.lang] }, },
                    continuation
                })
            })).json()
            if (!data) break
            const next = this.ParseContinuation(data)
            continuation = next[0]
            const messages = this.ParseActions(data)
            if (!Array.isArray(messages)) break
            for (const msg of messages) action(msg)
            await new Promise(res => setTimeout(res, ((next[1] ?? 5000) / 2)))
        }
        console.log("Stream End")
    }
}

export { YoutubeChat }
