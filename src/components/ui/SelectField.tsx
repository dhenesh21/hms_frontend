import { useFormContext, Controller } from 'react-hook-form'
import CustomSelect, { SelectOption } from './CustomSelect'

interface SelectFieldProps {
  name: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Drop-in replacement for <select {...register('name')} className="...">
 * Uses react-hook-form Controller + CustomSelect (violet, no blue highlight).
 *
 * Usage (inside a <FormProvider> or when useFormContext is available):
 *   <SelectField name="gender" options={[{ value: 'male', label: 'Male' }]} />
 *
 * If not inside FormProvider, use CustomSelect directly with useState.
 */
export default function SelectField({ name, options, placeholder = '— Select —', required, disabled }: SelectFieldProps) {
  const { control } = useFormContext()
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required }}
      render={({ field }) => (
        <CustomSelect
          value={field.value ?? ''}
          onChange={(v) => field.onChange(v)}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    />
  )
}
