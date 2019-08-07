import styled from '@emotion/styled';
import {Field} from 'formik';
import React from 'react';

import {ErrorInput} from '../../utils/content';
import {getDeep} from '../../utils/functions';
import {InputLabel, Label, Select} from '../../utils/new/design-system';

const FormSelectMain = styled(InputLabel)``;

function FormSelect({
	name,
	label,
	handleBlur,
	values,
	errors,
	touched,
	required,
	inline,
	onboarding,
	options,
	css,
	style,
	onChange,
	...rest
}) {
	return (
		<FormSelectMain
			inline={inline}
			onboarding={onboarding}
			css={css}
			style={style}
			required={required}
			data-test={name}
		>
			{label && (
				<Label htmlFor={name} required={required}>
					{label}
				</Label>
			)}
			<Field name={name} id={name} error={errors[name] && touched[name]}>
				{({form}) => (
					<Select
						id={name}
						onChange={(selected, ...args) => {
							form.setFieldValue(
								name,
								selected && selected.value,
							);
							onChange(selected, ...args);
						}}
						onBlur={(...args) => {
							form.setFieldTouched(name);
							handleBlur(...args);
						}}
						name={name}
						value={options.find(
							option => option.value === values[name],
						)}
						error={errors[name] && touched[name]}
						options={options}
						{...rest}
					/>
				)}
			</Field>
			{getDeep(name, errors) && getDeep(name, touched) && (
				<ErrorInput className="input-feedback">
					{getDeep(name, errors)}
				</ErrorInput>
			)}
		</FormSelectMain>
	);
}

FormSelect.defaultProps = {
	onChange: () => {},
};

export default FormSelect;
