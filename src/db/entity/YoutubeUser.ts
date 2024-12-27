import { Capture } from "./Capture"
import { Entity, Column, IdxEntity, OneToMany } from "./Entity"


@Entity()
export class YoutubeUser extends IdxEntity {
    @Column({ nullable: false })
    id: string

    @Column({ nullable: false })
    name: string

    @OneToMany(() => Capture, x => x.user, { eager: true })
    captures: Capture[]

    @Column({ default: false })
    streaming: boolean

    get url() {
        return `https://www.youtube.com/${this.id}`
    }
}
