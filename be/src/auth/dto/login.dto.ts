import { ApiProperty } from "@nestjs/swagger";
import {IsEmail,IsNotEmpty,IsOptional,IsString,MinLength} from "class-validator";

export class LoginDto{
    @ApiProperty()
    @IsNotEmpty({ message: 'Email hoặc tên đăng nhập không được để trống' })
    @IsString({ message: 'Email hoặc tên đăng nhập phải là chuỗi ký tự' })
    identifier:string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    password:string;
}