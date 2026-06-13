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
		{ title: "Мезон", dataIndex: "name", key: "name", ellipsis: true },
		{
			title: "Қиймат",
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
					title="Кўрсаткич ўчирилсинми?"
					okText="Ўчириш"
					cancelText="Бекор қилиш"
					onConfirm={() => onRemoveMetric(row.id)}
				>
					<Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Ўчириш" />
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
					"Ҳудуд"
				)
			}
			footer={
				<Button type="primary" block icon={<PlusOutlined />} onClick={() => setFormOpen(true)} disabled={!feature}>
					Кўрсаткич қўшиш
				</Button>
			}
		>
			{feature && p && (
				<>
					<Space size="large" style={{ width: "100%", justifyContent: "space-between" }}>
						<Statistic
							title="Майдон (факт)"
							value={p.area_test_ha ?? "—"}
							suffix={p.area_test_ha == null ? "" : "Га"}
							prefix={<AreaChartOutlined style={{ color: "#1D4ED8" }} />}
						/>
						<Statistic
							title="Рўйхат рақами"
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
							{ key: "code", label: "Ҳудуд коди", children: p.id },
							{
								key: "type",
								label: "Геометрия тури",
								children: feature.geometry.type === "MultiPolygon" ? "Мультиполигон" : "Полигон"
							},
							{ key: "decl", label: "Майдон (лойиҳа)", children: fmtHa(p.area_declared_ha) }
						]}
					/>

					<Divider titlePlacement="start" style={{ margin: "20px 0 12px" }}>
						Кўрсаткичлар
					</Divider>

					{metrics.length === 0 ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description="Кўрсаткичлар қўшилмаган"
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
