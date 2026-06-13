import { useState } from "react";
import {
	Button,
	Descriptions,
	Divider,
	Drawer,
	Empty,
	Popconfirm,
	Space,
	Statistic,
	Table,
	Tag,
	Typography
} from "antd";
import {
	AreaChartOutlined,
	DeleteOutlined,
	EnvironmentOutlined,
	PlusOutlined
} from "@ant-design/icons";
import type { ProjectFeature } from "../../projects/types";
import type { TerritoryMetric, TerritoryRecord } from "../types";
import AddMetricModal from "./AddMetricModal";

interface Props {
	open: boolean;
	feature: ProjectFeature | null;
	territory: TerritoryRecord | null;
	onClose: () => void;
	onAddMetric: (values: { name: string; value: string }) => void;
	onRemoveMetric: (metricId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
	planned: "Планируется",
	active: "В работе",
	done: "Завершён"
};

const fmtHa = (v: number | null) => (v == null ? "—" : `${v} Га`);

/** Professional GIS/Urban-planning territory card with metric management. */
export default function TerritoryDrawer({
	open,
	feature,
	territory,
	onClose,
	onAddMetric,
	onRemoveMetric
}: Props) {
	const [formOpen, setFormOpen] = useState(false);

	const p = feature?.properties;
	const metrics = territory?.metrics ?? [];

	const columns = [
		{ title: "Критерий", dataIndex: "name", key: "name", ellipsis: true },
		{
			title: "Значение",
			dataIndex: "value",
			key: "value",
			width: 120,
			render: (v: string) => <Typography.Text strong>{v}</Typography.Text>
		},
		{
			title: "",
			key: "action",
			width: 44,
			render: (_: unknown, row: TerritoryMetric) => (
				<Popconfirm
					title="Удалить показатель?"
					okText="Удалить"
					cancelText="Отмена"
					onConfirm={() => onRemoveMetric(row.id)}
				>
					<Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Удалить" />
				</Popconfirm>
			)
		}
	];

	return (
		<Drawer
			open={open}
			onClose={onClose}
			width={420}
			placement="right"
			styles={{ body: { paddingTop: 16 } }}
			title={
				feature && p ? (
					<Space size={10} align="center">
						<Tag color="blue" style={{ margin: 0, fontWeight: 600, fontFamily: "monospace" }}>
							{p.id}
						</Tag>
						<span style={{ fontSize: 15 }}>{territory?.name}</span>
					</Space>
				) : (
					"Территория"
				)
			}
			footer={
				<Button type="primary" block icon={<PlusOutlined />} onClick={() => setFormOpen(true)} disabled={!feature}>
					Добавить показатель
				</Button>
			}
		>
			{feature && p && (
				<>
					<Space size="large" style={{ width: "100%", justifyContent: "space-between" }}>
						<Statistic
							title="Площадь (факт)"
							value={p.area_test_ha ?? "—"}
							suffix={p.area_test_ha == null ? "" : "Га"}
							prefix={<AreaChartOutlined style={{ color: "#1D4ED8" }} />}
						/>
						<Statistic
							title="№ в реестре"
							value={p.order_no ?? "—"}
							prefix={<EnvironmentOutlined style={{ color: "#1D4ED8" }} />}
						/>
					</Space>

					{territory?.description && (
						<Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
							{territory.description}
						</Typography.Paragraph>
					)}

					<Divider style={{ margin: "16px 0" }} />

					<Descriptions
						column={1}
						size="small"
						bordered
						items={[
							{ key: "code", label: "Код территории", children: p.id },
							{
								key: "type",
								label: "Тип геометрии",
								children: feature.geometry.type === "MultiPolygon" ? "Мультиполигон" : "Полигон"
							},
							{ key: "decl", label: "Площадь (проект)", children: fmtHa(p.area_declared_ha) },
							{ key: "calc", label: "Площадь (расчёт)", children: fmtHa(p.area_computed_ha) },
							{
								key: "status",
								label: "Статус",
								children: <Tag color="processing">{STATUS_LABEL[p.status] ?? p.status}</Tag>
							},
							{
								key: "mismatch",
								label: "Расхождение площади",
								children: p.area_mismatch ? (
									<Tag color="error">есть</Tag>
								) : (
									<Tag color="success">нет</Tag>
								)
							}
						]}
					/>

					<Divider titlePlacement="start" style={{ margin: "20px 0 12px" }}>
						Показатели
					</Divider>

					{metrics.length === 0 ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description="Показатели не добавлены"
							style={{ margin: "16px 0" }}
						/>
					) : (
						<Table<TerritoryMetric>
							columns={columns}
							dataSource={metrics}
							rowKey="id"
							size="small"
							pagination={false}
						/>
					)}
				</>
			)}

			<AddMetricModal open={formOpen} onCancel={() => setFormOpen(false)} onSubmit={onAddMetric} />
		</Drawer>
	);
}
