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
		message.success("Показатель добавлен");
		form.resetFields();
		onCancel();
	};

	return (
		<Modal
			title="Добавить показатель"
			open={open}
			onOk={handleOk}
			onCancel={() => {
				form.resetFields();
				onCancel();
			}}
			okText="Сохранить"
			cancelText="Отмена"
			destroyOnHidden
		>
			<Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
				<Form.Item
					name="name"
					label="Название критерия"
					rules={[{ required: true, message: "Укажите название" }]}
				>
					<Input placeholder="Например: Площадь застройки" autoFocus />
				</Form.Item>
				<Form.Item
					name="value"
					label="Значение"
					rules={[{ required: true, message: "Укажите значение" }]}
				>
					<Input placeholder="Например: 15 Га" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
