<template>
	<div class="q-pa-md">
		<div class="text-h4 q-mb-lg">4K 视频流传输演示</div>

		<div class="row q-col-gutter-md">
			<!-- 左侧：配置和状态 -->
			<div class="col-md-4 col-12">
				<StreamConfiguration />

				<!-- 说明 -->
				<q-card>
					<q-card-section>
						<div class="text-h6 q-mb-sm">使用说明</div>
						<q-list dense bordered separator>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-1-circle" color="primary" />
								</q-item-section>
								<q-item-section>配置网络并选择视频源（摄像头或视频文件）</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-2-circle" color="primary" />
								</q-item-section>
								<q-item-section>点击"创建 UDP 连接"建立网络连接</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-3-circle" color="primary" />
								</q-item-section>
								<q-item-section>点击"开始传输"启动采集并开始编码传输</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-4-circle" color="primary" />
								</q-item-section>
								<q-item-section>右侧将显示接收到的视频流</q-item-section>
							</q-item>
							<q-item>
								<q-item-section avatar>
									<q-icon name="mdi-numeric-5-circle" color="primary" />
								</q-item-section>
								<q-item-section>观察帧率、延迟等统计信息</q-item-section>
							</q-item>
						</q-list>
						<div class="q-mt-md text-warning bg-yellow-1 q-pa-sm rounded-borders border-warning">
							<strong>注意：</strong>需要安装 HEVC 视频扩展以支持 H.265 编解码
						</div>
					</q-card-section>
				</q-card>
			</div>

			<!-- 右侧：视频流 -->
			<div class="col-md-8 col-12">
				<div v-if="connectionId !== null" class="row q-col-gutter-md">
					<div class="col-lg-6 col-12">
						<q-card class="full-height">
							<q-card-section>
								<div class="text-h6 q-mb-sm">本地预览</div>
								<CameraPreview />
							</q-card-section>
						</q-card>
					</div>
					<div class="col-lg-6 col-12">
						<q-card class="full-height">
							<q-card-section>
								<div class="text-h6 q-mb-sm">远程接收画面</div>
								<RemoteVideoDisplay />
							</q-card-section>
						</q-card>
					</div>
				</div>
				<div
					v-else
					class="flex-center text-grey-5 flex"
					style="height: 400px; border: 2px dashed currentColor; border-radius: 8px"
				>
					<div class="text-center">
						<q-icon name="mdi-video-off" size="4rem" />
						<div class="text-h6 q-mt-sm">请先创建连接</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import CameraPreview from '../modules/videoStream/components/CameraPreview.vue';
import RemoteVideoDisplay from '../modules/videoStream/components/RemoteVideoDisplay.vue';
import StreamConfiguration from '../modules/videoStream/components/StreamConfiguration.vue';
import { provideStreamConfig } from '../modules/videoStream/composables/useStreamConfig';

// Provide stream configuration state
const { connectionId } = provideStreamConfig();
</script>
