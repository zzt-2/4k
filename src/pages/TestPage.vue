<template>
	<div class="q-pa-md">
		<div class="text-h3 q-mb-lg">Quasar 组件 CSS 测试页面</div>

		<!-- 按钮组件 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">按钮 (QBtn)</div>
				<div class="q-gutter-sm q-mt-sm">
					<div class="text-subtitle2 q-mt-md">标准按钮</div>
					<div class="q-gutter-sm">
						<q-btn label="默认按钮" />
						<q-btn color="primary" label="主要按钮" />
						<q-btn color="secondary" label="次要按钮" />
						<q-btn color="accent" label="强调按钮" />
						<q-btn color="positive" label="成功按钮" />
						<q-btn color="negative" label="危险按钮" />
						<q-btn color="warning" label="警告按钮" />
						<q-btn color="info" label="信息按钮" />
					</div>

					<div class="text-subtitle2 q-mt-md">按钮样式</div>
					<div class="q-gutter-sm">
						<q-btn outline label="轮廓按钮" />
						<q-btn flat color="primary" label="扁平按钮" />
						<q-btn unelevated color="primary" label="无阴影按钮" />
						<q-btn push color="primary" label="凸起按钮" />
						<q-btn glossy color="primary" label="光泽按钮" />
					</div>

					<div class="text-subtitle2 q-mt-md">按钮大小和图标</div>
					<div class="q-gutter-sm">
						<q-btn size="xs" color="primary" label="超小" />
						<q-btn size="sm" color="primary" label="小" />
						<q-btn size="md" color="primary" label="中等" />
						<q-btn size="lg" color="primary" label="大" />
						<q-btn size="xl" color="primary" label="超大" />
					</div>

					<div class="text-subtitle2 q-mt-md">特殊按钮</div>
					<div class="q-gutter-sm">
						<q-btn round color="primary" icon="mdi-plus" />
						<q-btn round dense color="secondary" icon="mdi-minus" />
						<q-btn color="primary" icon-right="mdi-send" label="发送" />
						<q-btn color="secondary" icon="mdi-delete" label="删除" />
						<q-btn-dropdown color="primary" label="下拉按钮">
							<q-list>
								<q-item clickable v-close-popup>
									<q-item-section>
										<q-item-label>选项 1</q-item-label>
									</q-item-section>
								</q-item>
								<q-item clickable v-close-popup>
									<q-item-section>
										<q-item-label>选项 2</q-item-label>
									</q-item-section>
								</q-item>
								<q-separator />
								<q-item clickable v-close-popup>
									<q-item-section>
										<q-item-label>选项 3</q-item-label>
									</q-item-section>
								</q-item>
							</q-list>
						</q-btn-dropdown>
						<q-btn
							:loading="buttonLoading"
							color="primary"
							label="加载按钮"
							@click="toggleButtonLoading"
						/>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 输入组件 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">输入组件 (QInput)</div>
				<div class="row q-col-gutter-md q-mt-sm">
					<div class="col-md-6 col-12">
						<q-input
							v-model="textInput"
							label="文本输入框"
							outlined
							clearable
							hint="这是一个文本输入框"
							@update:model-value="onTextInputUpdate"
						/>
					</div>
					<div class="col-md-6 col-12">
						<q-input v-model="passwordInput" label="密码输入框" outlined type="password" />
					</div>
					<div class="col-md-6 col-12">
						<q-input v-model="emailInput" label="邮箱输入框" outlined type="email" />
					</div>
					<div class="col-md-6 col-12">
						<q-input v-model="numberInput" label="数字输入框" outlined type="number" />
					</div>
					<div class="col-12">
						<q-input v-model="textareaInput" label="文本区域" outlined type="textarea" rows="3" />
					</div>
					<div class="col-md-6 col-12">
						<q-input v-model="textInput" label="带前缀图标" outlined>
							<template #prepend>
								<q-icon name="mdi-email" />
							</template>
						</q-input>
					</div>
					<div class="col-md-6 col-12">
						<q-input v-model="textInput" label="带后缀按钮" outlined clearable />
					</div>
				</div>

				<div class="text-h6 q-mt-lg q-mb-md">选择组件 (QSelect)</div>
				<div class="row q-col-gutter-md">
					<div class="col-md-6 col-12">
						<q-select
							v-model="selectValue"
							:options="selectOptions"
							label="选择框"
							outlined
							emit-value
							map-options
						/>
					</div>
					<div class="col-md-6 col-12">
						<q-select
							v-model="multiSelectValue"
							:options="selectOptions"
							label="多选框"
							outlined
							multiple
							emit-value
							map-options
						/>
					</div>
					<div class="col-md-6 col-12">
						<q-select
							v-model="filteredSelectValue"
							:options="selectOptions"
							label="可搜索选择框"
							outlined
							use-input
							@filter="onSelectFilter"
							emit-value
							map-options
						/>
					</div>
					<div class="col-md-6 col-12">
						<q-select
							v-model="groupSelectValue"
							:options="groupedSelectOptions"
							label="分组选择框"
							outlined
							emit-value
							map-options
						/>
					</div>
					<div class="col-12">
						<q-select
							v-model="themeSelectValue"
							:options="themeOptions"
							label="主题设置"
							outlined
							emit-value
							map-options
							@update:model-value="setTheme"
						/>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 选择组件 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">选择组件</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">复选框 (QCheckbox)</div>
						<div class="q-gutter-sm">
							<q-checkbox v-model="checkboxValue" label="基础复选框" />
							<q-checkbox
								v-model="checkboxIndeterminate"
								indeterminate-value="maybe"
								label="不确定状态复选框"
							/>
							<q-checkbox v-model="checkboxDisabled" disable label="禁用复选框" />
							<div class="q-gutter-sm">
								<q-checkbox
									v-for="item in checkboxList"
									:key="item"
									v-model="selectedCheckboxes"
									:val="item"
									:label="item"
								/>
							</div>
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">单选框 (QRadio)</div>
						<div class="q-gutter-sm">
							<q-radio v-model="radioValue" val="option1" label="选项 1" />
							<q-radio v-model="radioValue" val="option2" label="选项 2" />
							<q-radio v-model="radioValue" val="option3" label="选项 3" />
							<q-radio v-model="radioValue" val="option4" label="禁用选项" disable />
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">开关 (QToggle)</div>
						<div class="q-gutter-sm">
							<q-toggle v-model="toggleValue" label="基础开关" />
							<q-toggle v-model="toggleValue2" label="禁用开关" disable />
							<q-toggle v-model="toggleValue3" label="图标开关" icon="mdi-check" />
							<q-toggle
								v-model="toggleValue4"
								checked-icon="mdi-check"
								unchecked-icon="mdi-close"
								label="自定义图标开关"
							/>
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">选项按钮 (QOptionGroup)</div>
						<q-option-group
							v-model="optionGroupValue"
							:options="optionGroupOptions"
							color="primary"
						/>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 滑块 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">滑块 (QSlider & QRange)</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">基础滑块</div>
						<q-slider v-model="sliderValue" :min="0" :max="100" label color="primary" />
						<div class="text-caption q-mt-sm">值: {{ sliderValue }}</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">范围滑块</div>
						<q-range v-model="rangeValue" :min="0" :max="100" label color="secondary" />
						<div class="text-caption q-mt-sm">
							最小值: {{ rangeValue.min }}, 最大值: {{ rangeValue.max }}
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">刻度滑块</div>
						<q-slider
							v-model="sliderValueWithMarkers"
							:min="0"
							:max="10"
							:step="1"
							markers
							label
							color="accent"
						/>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">垂直滑块</div>
						<div class="row">
							<div style="width: 60px; height: 200px">
								<q-slider
									v-model="verticalSliderValue"
									:min="0"
									:max="100"
									vertical
									label
									color="primary"
								/>
							</div>
						</div>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 标签和徽章 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">标签 & 徽章</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">徽章 (QBadge)</div>
						<div class="q-gutter-sm">
							<q-badge color="primary">主要徽章</q-badge>
							<q-badge color="secondary">次要徽章</q-badge>
							<q-badge color="positive">成功徽章</q-badge>
							<q-badge color="negative">错误徽章</q-badge>
							<q-badge color="warning">警告徽章</q-badge>
							<q-badge color="info">信息徽章</q-badge>
							<q-icon name="mdi-heart" color="negative" size="md">
								<q-badge floating rounded dense color="positive">5</q-badge>
							</q-icon>
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">标签 (QChip)</div>
						<div class="q-gutter-sm">
							<q-chip
								color="primary"
								text-color="white"
								icon="mdi-bookmark"
								label="主要标签"
								clickable
								@click="notify('点击标签')"
							/>
							<q-chip
								color="secondary"
								text-color="white"
								removable
								@remove="notify('删除标签')"
								label="可删除标签"
							/>
							<q-chip
								color="accent"
								text-color="white"
								clickable
								avatar="https://cdn.quasar.dev/img/avatar.png"
								label="头像标签"
							/>
							<q-chip
								v-for="item in chipList"
								:key="item"
								color="info"
								text-color="white"
								removable
								@remove="removeChip(item)"
								:label="item"
							/>
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">分割线 (QSeparator)</div>
						<div class="q-gutter-sm">
							<q-separator />
							<q-separator spaced inset />
							<q-separator vertical style="height: 30px" />
							<q-separator class="q-my-md" color="primary" />
						</div>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 进度条 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">进度条</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">线性进度条 (QLinearProgress)</div>
						<q-linear-progress :value="progressValue" color="primary" />
						<q-linear-progress :value="progressValue" color="secondary" class="q-mt-md" />
						<q-linear-progress indeterminate color="accent" class="q-mt-md" />
						<q-linear-progress
							:value="progressValue"
							size="20px"
							color="positive"
							class="q-mt-md"
						/>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">圆形进度条 (QCircularProgress)</div>
						<div class="row q-gutter-md">
							<q-circular-progress :value="progressValue" size="80px" color="primary" show-value />
							<q-circular-progress
								:value="progressValue"
								size="80px"
								color="secondary"
								show-value
							/>
							<q-circular-progress :value="progressValue" size="80px" color="accent" show-value />
							<q-circular-progress indeterminate size="80px" color="positive" />
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">进度控制</div>
						<div class="row q-gutter-md q-mt-sm">
							<q-btn color="primary" label="增加进度" @click="increaseProgress" />
							<q-btn color="secondary" label="减少进度" @click="decreaseProgress" />
							<q-btn color="accent" label="重置进度" @click="resetProgress" />
						</div>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 图标 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">图标 (QIcon)</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">图标大小</div>
						<div class="q-gutter-md">
							<div class="row q-gutter-sm items-center">
								<q-icon name="mdi-home" size="xs" color="primary" />
								<span class="text-caption">超小 (xs)</span>
							</div>
							<div class="row q-gutter-sm items-center">
								<q-icon name="mdi-home" size="sm" color="primary" />
								<span class="text-caption">小 (sm)</span>
							</div>
							<div class="row q-gutter-sm items-center">
								<q-icon name="mdi-home" size="md" color="primary" />
								<span class="text-caption">中等 (md)</span>
							</div>
							<div class="row q-gutter-sm items-center">
								<q-icon name="mdi-home" size="lg" color="primary" />
								<span class="text-caption">大 (lg)</span>
							</div>
							<div class="row q-gutter-sm items-center">
								<q-icon name="mdi-home" size="xl" color="primary" />
								<span class="text-caption">超大 (xl)</span>
							</div>
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">图标颜色</div>
						<div class="q-gutter-sm">
							<q-icon name="mdi-home" size="md" color="primary" />
							<q-icon name="mdi-settings" size="md" color="secondary" />
							<q-icon name="mdi-heart" size="md" color="negative" />
							<q-icon name="mdi-star" size="md" color="warning" />
							<q-icon name="mdi-information" size="md" color="info" />
							<q-icon name="mdi-check-circle" size="md" color="positive" />
							<q-icon name="mdi-account" size="md" color="accent" />
						</div>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">更多图标示例</div>
						<div class="q-gutter-sm">
							<q-icon name="mdi-email" size="md" color="primary" />
							<q-icon name="mdi-phone" size="md" color="secondary" />
							<q-icon name="mdi-map-marker" size="md" color="accent" />
							<q-icon name="mdi-calendar" size="md" color="positive" />
							<q-icon name="mdi-clock" size="md" color="warning" />
							<q-icon name="mdi-lock" size="md" color="negative" />
							<q-icon name="mdi-download" size="md" />
							<q-icon name="mdi-upload" size="md" />
						</div>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 标签页 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">标签页 (QTabs)</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">标准标签页</div>
						<q-tabs v-model="tab" class="text-body">
							<q-tab name="mails" icon="mdi-email" label="邮件" />
							<q-tab name="alarms" icon="mdi-alarm" label="闹钟" />
							<q-tab name="movies" icon="mdi-movie" label="电影" />
						</q-tabs>
						<q-tab-panels v-model="tab" animated class="q-mt-md">
							<q-tab-panel name="mails">
								<div class="text-subtitle1 q-mb-md">邮件面板</div>
								<p>这是邮件面板的内容，展示标签页的切换效果</p>
							</q-tab-panel>
							<q-tab-panel name="alarms">
								<div class="text-subtitle1 q-mb-md">闹钟面板</div>
								<p>这是闹钟面板的内容，可以测试动画效果</p>
							</q-tab-panel>
							<q-tab-panel name="movies">
								<div class="text-subtitle1 q-mb-md">电影面板</div>
								<p>这是电影面板的内容，每个面板可以有不同的样式</p>
							</q-tab-panel>
						</q-tab-panels>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">横向滚动标签页</div>
						<q-tabs v-model="tab2" class="text-muted" scrollable>
							<q-tab name="tab1" label="标签 1" />
							<q-tab name="tab2" label="标签 2" />
							<q-tab name="tab3" label="标签 3" />
							<q-tab name="tab4" label="标签 4" />
							<q-tab name="tab5" label="标签 5" />
							<q-tab name="tab6" label="标签 6" />
						</q-tabs>
						<q-tab-panels v-model="tab2" class="q-mt-md">
							<q-tab-panel name="tab1">内容 1</q-tab-panel>
							<q-tab-panel name="tab2">内容 2</q-tab-panel>
							<q-tab-panel name="tab3">内容 3</q-tab-panel>
							<q-tab-panel name="tab4">内容 4</q-tab-panel>
							<q-tab-panel name="tab5">内容 5</q-tab-panel>
							<q-tab-panel name="tab6">内容 6</q-tab-panel>
						</q-tab-panels>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 表格 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">表格 (QTable)</div>
				<div class="q-gutter-md q-mt-sm">
					<div>
						<div class="text-subtitle2 q-mb-sm">基础表格</div>
						<q-table
							class="my-border-default"
							:rows="tableRows"
							:columns="tableColumns"
							row-key="name"
							:alternating-rows="true"
							:pagination="{ rowsPerPage: 5 }"
							flat
							bordered
						/>
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">紧凑表格</div>
						<q-table :rows="tableRows" :columns="tableColumns" row-key="name" dense flat bordered />
					</div>

					<div>
						<div class="text-subtitle2 q-mb-sm">可选择表格</div>
						<q-table
							:rows="tableRows"
							:columns="tableColumns"
							row-key="name"
							:selected="selectedTableRows"
							:selection="tableSelection"
							@update:selected="updateTableSelection"
							flat
							bordered
						/>
					</div>
				</div>
			</q-card-section>
		</q-card>

		<!-- 对话框和菜单 -->
		<q-card class="q-mb-md">
			<q-card-section>
				<div class="text-h6">对话框 & 菜单</div>
				<div class="q-gutter-sm q-mt-sm">
					<q-btn color="primary" label="打开对话框" @click="dialogOpen = true" />
					<q-btn color="secondary" label="显示通知" @click="showNotification" />
					<q-btn color="accent" label="显示加载中" @click="showLoading" />

					<q-btn color="primary" label="下拉菜单">
						<q-menu>
							<q-list style="min-width: 100px">
								<q-item clickable v-close-popup>
									<q-item-section>选项一</q-item-section>
								</q-item>
								<q-item clickable v-close-popup>
									<q-item-section>选项二</q-item-section>
								</q-item>
								<q-separator />
								<q-item clickable v-close-popup>
									<q-item-section>退出</q-item-section>
								</q-item>
							</q-list>
						</q-menu>
					</q-btn>
				</div>
			</q-card-section>
		</q-card>

		<!-- 对话框 -->
		<q-dialog v-model="dialogOpen">
			<q-card>
				<q-card-section>
					<div class="text-h6">测试对话框</div>
				</q-card-section>
				<q-card-section> 这是一个测试对话框，如果CSS正常，你应该看到美观的样式。 </q-card-section>
				<q-card-actions align="right">
					<q-btn flat label="取消" color="primary" v-close-popup />
					<q-btn flat label="确定" color="primary" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>

		<!-- 浮动操作按钮 -->
		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-fab color="accent" icon="mdi-plus" direction="up">
				<q-fab-action color="primary" @click="onFabClick" icon="mdi-pencil" />
				<q-fab-action color="secondary" @click="onFabClick" icon="mdi-delete" />
			</q-fab>
		</q-page-sticky>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useThemeManager } from '@core/stores/theme-manager';

const $q = useQuasar();
const { themes, setTheme } = useThemeManager();

// 按钮数据
const buttonLoading = ref<boolean>(false);

// 输入组件数据
const textInput = ref<string>('');
const passwordInput = ref<string>('');
const emailInput = ref<string>('');
const numberInput = ref<number | null>(null);
const textareaInput = ref<string>('');
const selectValue = ref<string | null>(null);
const multiSelectValue = ref<string[]>([]);
const filteredSelectValue = ref<string | null>(null);
const groupSelectValue = ref<string | null>(null);
const selectOptions = ref<string[]>(['选项一', '选项二', '选项三']);
const groupedSelectOptions = ref([
	{ label: '分组 1', options: ['选项 1', '选项 2'] },
	{ label: '分组 2', options: ['选项 3', '选项 4'] },
]);

// 选择组件数据
const checkboxValue = ref<boolean>(false);
const checkboxIndeterminate = ref<boolean | string>(false);
const checkboxDisabled = ref<boolean>(false);
const checkboxList = ref<string[]>(['项目 1', '项目 2', '项目 3']);
const selectedCheckboxes = ref<string[]>([]);
const radioValue = ref<string>('option1');
const toggleValue = ref<boolean>(false);
const toggleValue2 = ref<boolean>(false);
const toggleValue3 = ref<boolean>(false);
const toggleValue4 = ref<boolean>(false);
const optionGroupValue = ref<string>('opt1');
const optionGroupOptions = ref([
	{ label: '选项 1', value: 'opt1' },
	{ label: '选项 2', value: 'opt2' },
	{ label: '选项 3', value: 'opt3' },
]);

// 主题设置
const themeSelectValue = ref<string>('dark');
const themeOptions = computed(() =>
	themes.map((theme) => ({ label: theme.label, value: theme.id }))
);

// 滑块
const sliderValue = ref<number>(30);
const sliderValueWithMarkers = ref<number>(5);
const verticalSliderValue = ref<number>(50);
const rangeValue = ref({ min: 20, max: 80 });

// 进度条
const progressValue = computed(() => sliderValue.value / 100);

// 标签页
const tab = ref<string>('mails');
const tab2 = ref<string>('tab1');

// 标签/徽章
const chipList = ref<string[]>(['标签 1', '标签 2', '标签 3']);

// 对话框
const dialogOpen = ref<boolean>(false);

// 表格数据
const tableColumns = ref([
	{ name: 'name', label: '姓名', field: 'name', align: 'left' as const },
	{ name: 'age', label: '年龄', field: 'age', align: 'center' as const },
	{ name: 'city', label: '城市', field: 'city', align: 'left' as const },
]);

const tableRows = ref([
	{ name: '张三', age: 25, city: '北京' },
	{ name: '李四', age: 30, city: '上海' },
	{ name: '王五', age: 28, city: '广州' },
	{ name: '赵六', age: 35, city: '深圳' },
	{ name: '钱七', age: 22, city: '杭州' },
]);

const selectedTableRows = ref([]);
const tableSelection = ref<'single' | 'multiple'>('multiple');

const onTextInputUpdate = (value: string) => {
	console.log('文本输入框更新：', value);
};

// 按钮加载状态
const toggleButtonLoading = () => {
	buttonLoading.value = true;
	setTimeout(() => {
		buttonLoading.value = false;
		showNotification();
	}, 2000);
};

// 进度条控制
const increaseProgress = () => {
	if (sliderValue.value < 100) {
		sliderValue.value += 10;
	}
};

const decreaseProgress = () => {
	if (sliderValue.value > 0) {
		sliderValue.value -= 10;
	}
};

const resetProgress = () => {
	sliderValue.value = 0;
};

// 选择框过滤
const onSelectFilter = (val: string, update: any) => {
	if (val === '') {
		update(() => {
			// 重置选项
		});
	} else {
		update(() => {
			// 过滤选项
		});
	}
};

// 标签移除
const removeChip = (item: string) => {
	const index = chipList.value.indexOf(item);
	if (index !== -1) {
		chipList.value.splice(index, 1);
	}
	showNotification();
};

// 表格选择更新
const updateTableSelection = (val: any) => {
	selectedTableRows.value = val;
};

// 通知功能
const notify = (message: string) => {
	$q.notify({
		message,
		color: 'positive',
		position: 'top',
		icon: 'mdi-check-circle',
	});
};

const showNotification = () => {
	notify('这是一条测试通知');
};

// 加载中功能
const showLoading = () => {
	$q.loading.show({
		message: '加载中...',
	});

	setTimeout(() => {
		$q.loading.hide();
	}, 2000);
};

// FAB 点击事件
const onFabClick = () => {
	notify('FAB 按钮被点击了');
};
</script>
