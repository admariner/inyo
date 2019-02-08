import React from 'react';
import styled from '@emotion/styled';

import {ReactComponent as CloseIcon} from '../../utils/icons/close.svg';

import {
	ModalContainer,
	ModalElem,
	ModalCloseIcon,
	P,
	Button,
} from '../../utils/content';

const ModalRow = styled('div')`
	padding-left: 20px;
	padding-right: 40px;
	padding-top: 5px;
	padding-bottom: 5px;
`;

const ModalRowHoriz = styled(ModalRow)`
	display: flex;
	justify-content: flex-end;
`;

export default function ConfirmModal({children, onConfirm, closeModal}) {
	return (
		<ModalContainer size="small">
			<ModalElem>
				<ModalCloseIcon>
					<CloseIcon onClick={closeModal} />
				</ModalCloseIcon>
				<ModalRow>{children}</ModalRow>
				<ModalRowHoriz>
					<Button
						theme="Link"
						tabindex="-1"
						onClick={() => onConfirm(false)}
					>
						Annuler
					</Button>
					<Button
						theme="Primary"
						type="submit"
						tabindex="-1"
						onClick={() => onConfirm(true)}
					>
						Valider
					</Button>
				</ModalRowHoriz>
			</ModalElem>
		</ModalContainer>
	);
}