import { Entity, Column, IdxEntity, ManyToOne } from "./Entity"
import { YoutubeUser } from "./YoutubeUser"


@Entity()
export class Capture extends IdxEntity {
    @Column({ nullable: false })
    guildid: string

    @Column({ nullable: false })
    id: string

    @Column({ nullable: true })
    target?: string

    @ManyToOne(() => YoutubeUser, x => x.captures)
    user: Promise<YoutubeUser>
}
