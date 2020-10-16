import { DocumentType, prop } from '@typegoose/typegoose'
import crypto from 'crypto'
import Item from '../item'


export default class Member extends Item {
  @prop()
  public password: string

  @prop()
  public deleted: boolean

  authenticate(this: DocumentType<Member>, password: string): boolean {
    const passwordHash = crypto
      .createHash('sha256')
      .update(password, 'utf8')
      .digest().toString('hex')
    return this.password === passwordHash && !this.deleted
  }
}
