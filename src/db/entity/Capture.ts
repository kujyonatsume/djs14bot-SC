import { Entity, Column, IdxEntity, ManyToOne, OneToMany } from "./Entity"
import { UserTarget } from "./UserTarget"
import { YoutubeUser } from "./YoutubeUser"


@Entity()
export class Capture extends IdxEntity {
    @Column({ nullable: false })
    guildid: string

    @Column({ nullable: false })
    id: string

    @OneToMany(() => UserTarget, x => x.capture, { eager: true })
    targets: UserTarget[]

    @ManyToOne(() => YoutubeUser, x => x.captures)
    user: Promise<YoutubeUser>
}
