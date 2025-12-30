/**
 * 帧分片工具
 * 将大数据包切割为适合 UDP 传输的小包
 */

import { createFrameHeader, VIDEO_FRAME_HEADER_SIZE } from './protocol';

/**
 * MTU 大小 (字节)
 * 协议头 18 字节 + 数据 1382 字节 = 1400 字节
 */
export const MTU = 1400;

/**
 * 每个分片的最大数据大小 (字节)
 */
export const MAX_PACKET_DATA_SIZE = MTU - VIDEO_FRAME_HEADER_SIZE; // 1382 字节

/**
 * 判断数据是否需要分片
 * @param dataSize 数据大小（字节）
 * @returns 是否需要分片
 */
export function needsFragmentation(dataSize: number): boolean {
	return dataSize > MTU;
}

/**
 * 将大数据包分片为多个小包
 * @param frameData 原始数据（已包含帧类型标志在前 4 字节）
 * @param frameId 帧 ID
 * @returns 分片后的 Buffer 数组，每个 Buffer 包含协议头 + 数据
 */
export function fragmentFrame(frameData: Buffer, frameId: number): Buffer[] {
	const dataSize = frameData.length;
	const totalPackets = Math.ceil(dataSize / MAX_PACKET_DATA_SIZE);
	const packets: Buffer[] = [];

	for (let i = 0; i < totalPackets; i++) {
		const start = i * MAX_PACKET_DATA_SIZE;
		const end = Math.min(start + MAX_PACKET_DATA_SIZE, dataSize);
		const chunkData = frameData.subarray(start, end);

		// 创建帧头
		const headerBuffer = createFrameHeader(
			frameId & 0xffff, // 确保在 0-65535 范围内
			i, // packetIndex
			totalPackets
		);

		// 组合帧头和数据
		const packet = Buffer.concat([headerBuffer, chunkData]);
		packets.push(packet);
	}

	return packets;
}

/**
 * 计算数据需要多少个分片
 * @param dataSize 数据大小（字节）
 * @returns 分片数量
 */
export function calculatePacketCount(dataSize: number): number {
	return Math.ceil(dataSize / MAX_PACKET_DATA_SIZE);
}
