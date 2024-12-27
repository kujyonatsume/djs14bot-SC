export * from "./LiveChat"
/*
import { Command, Group, Module, Option, SubCommand, SubGroup } from "../decorator";

@Group({ permission: "Administrator" })
export class Support extends Module {

    @Command({ local: "測試指令" })
    async command(@Option() test: string) {
        return await this.SuccessEmbed(test)
    }
    
    static group = SubGroup({ name: "group" })
    @Support.group()
    async cmd(@Option() test: string) {
        return await this.SuccessEmbed(test)
    }
    
    @SubCommand()
    async subcmd(@Option() test: string) {
        return await this.SuccessEmbed(test)
    }
}
*/