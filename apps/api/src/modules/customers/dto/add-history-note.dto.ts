import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddHistoryNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note!: string;
}
