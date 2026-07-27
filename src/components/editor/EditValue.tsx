import { type FormState } from '../../core';
import { setCurrentDoc, getForm, getDefaults, updateForm } from '../../store';
import type { DocId } from '../../docs';
import styles from './common.module.css';

type StringFormKey = Exclude<keyof FormState, 'loader'>;

export function EditValue(props: {
  formKey: StringFormKey,
  docId: DocId,
  valueFixer?: (v: string) => string,
}) {
  return (
    <span class={styles.editCell}>
      <input
        type="text"
        class={styles.inlineInput}
        value={getForm()[props.formKey]}
        placeholder={getDefaults()[props.formKey]}
        onInput={e => {
          const v = e.currentTarget.value;
          updateForm(props.formKey, props.valueFixer ? props.valueFixer(v) : v);
        }}
        onFocus={() => setCurrentDoc(props.docId)}
        autocomplete="off"
        spellcheck={false}
      />
    </span>
  );
}
