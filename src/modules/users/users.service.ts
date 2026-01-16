import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ✅ dùng cho Auth & Seeder
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // ✅ admin: lấy danh sách user
  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password') // 🔥 không trả password
      .exec();
  }

  // ✅ admin: xem chi tiết user
  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return user;
  }

  // ✅ dùng cho seed + register
  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  // ✅ admin: cập nhật user
  async update(id: string, data: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return user;
  }

  // ✅ admin: xoá user
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('User không tồn tại');
    }

    return { message: 'Xoá user thành công' };
  }
}
