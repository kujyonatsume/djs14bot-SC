import { Capture } from "./Capture"
import { Entity, Column, IdxEntity, ManyToOne } from "./Entity"


@Entity()
export class UserTarget extends IdxEntity {
    @Column({ nullable: false })
    id: string
    
    @Column({ nullable: false })
    name: string

    @ManyToOne(() => Capture, x => x.targets)
    capture: Promise<Capture>
}
