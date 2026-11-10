import React from 'react'
import { CLOUDS, ENVIRONMENTS } from '../services/dataService'
import './ContextFilterSelector.css'

const ENV_LABELS = {
  DEV: 'Dev',
  IT: 'IT',
  UAT: 'UAT',
  PROD: 'Prod'
}

const SelectionRow = ({ label, options, value, onChange, disabled = false }) => (
  <div className={`context-filter-row ${disabled ? 'disabled' : ''}`}>
    <span className="context-filter-label">{label}</span>
    <div className="context-filter-options" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id || 'all'}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          disabled={disabled}
          className={`context-filter-option ${value === option.id ? 'active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)

/**
 * ODP360 DeploymentContextSelector-style grouped filters.
 * Cloud: All | AWS | Azure
 * Environment: All | Dev | IT | UAT | Production
 */
const ContextFilterSelector = ({
  cloud,
  onCloudChange,
  environment,
  onEnvironmentChange,
  summary,
  additionalRows = []
}) => {
  const cloudOptions = [
    { id: '', label: 'All' },
    ...CLOUDS.map((c) => ({ id: c, label: c }))
  ]

  const environmentOptions = [
    { id: '', label: 'All' },
    ...ENVIRONMENTS.map((e) => ({ id: e, label: ENV_LABELS[e] || e }))
  ]

  return (
    <div className="context-filter-selector">
      <SelectionRow
        label="Cloud"
        options={cloudOptions}
        value={cloud}
        onChange={onCloudChange}
      />
      <SelectionRow
        label="Environment"
        options={environmentOptions}
        value={environment}
        onChange={onEnvironmentChange}
      />

      {additionalRows.map((row) => (
        <SelectionRow
          key={row.label}
          label={row.label}
          options={row.options}
          value={row.value}
          onChange={row.onChange}
          disabled={row.disabled}
        />
      ))}

      {summary && (
        <div className="context-filter-summary" aria-live="polite">
          {summary}
        </div>
      )}
    </div>
  )
}

export default ContextFilterSelector
