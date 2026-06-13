import { App, Form, Input, Modal } from "antd";

interface Values {
	name: string;
	value: string;
}

interface Props {
	open: boolean;
	onCancel: () => void;
	onSubmit: (values: Values) => void;
}

/** Modal form for adding a single territory metric (name + value). */
export default function AddMetricModal({ open, onCancel, onSubmit }: Props) {
	const [form] = Form.useForm<Values>();
	const { message } = App.useApp();

	const handleOk = async () => {
		const values = await form.validateFields();
		onSubmit({ name: values.name.trim(), value: values.value.trim() });
		message.success("Кўрсаткич қўшилди");
		form.resetFields();
		onCancel();
	};

	return (
		<Modal
			title="Кўрсаткич қўшиш"
			open={open}
			onOk={handleOk}
			onCancel={() => {
				form.resetFields();
				onCancel();
			}}
			okText="Сақлаш"
			cancelText="Бекор қилиш"
			destroyOnHidden
		>
			<Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
				<Form.Item
					name="name"
					label="Мезон номи"
					rules={[{ required: true, message: "Номни киритинг" }]}
				>
					<Input placeholder="Масалан: Қурилиш майдони" autoFocus />
				</Form.Item>
				<Form.Item
					name="value"
					label="Қиймат"
					rules={[{ required: true, message: "Қийматни киритинг" }]}
				>
					<Input placeholder="Масалан: 15 Га" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
