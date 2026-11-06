import React, { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const fieldDescriptions = {
  'account name': 'A label you will recognize when choosing where money is held or moved.',
  'account type': 'Classifies this account, such as a bank account, wallet, card, or cash.',
  currency: 'The currency used to record amounts for this account or transaction.',
  'opening balance': 'The amount already in this account on the date you start tracking it.',
  'current balance': 'The account balance you want to record as of today.',
  'notes / description': 'Optional details to help you identify this account later.',
  'budget name': 'A short name that identifies what this spending limit is for.',
  period: 'How often this budget resets, such as monthly or quarterly.',
  'allocated amount': 'The total amount you plan to spend during this budget period.',
  'start date': 'The first day included in this budget period.',
  'end date': 'The last day included in this budget period.',
  'client name': 'The person or organization you work with and bill.',
  'company name': 'The client\'s business or organization, if applicable.',
  'email address': 'An email address for account access or client billing and notices.',
  'default currency': 'The currency to preselect for this client\'s projects and invoices.',
  'phone number': 'A phone number for contacting this client.',
  phone: 'A phone number for contacting this client.',
  'payment terms': 'When payment is due after you send an invoice to this client.',
  'billing address': 'The address to show on invoices issued to this client.',
  'expense amount': 'The amount paid for this expense, before any currency conversion.',
  description: 'A short explanation of what this transaction or record is for.',
  date: 'The date this income, expense, or transaction occurred.',
  'account paid from': 'The account that paid for this expense.',
  category: 'A label used to group this entry in reports and summaries.',
  'business expense': 'Mark this if the expense was incurred for your freelance business.',
  'business transaction': 'Mark this if the transaction belongs to your business records.',
  'tax deductible': 'Mark this when the expense should be included in deductible expense reporting.',
  'gross amount earned': 'The full payment amount before platform or processing fees.',
  'platform / processing fee (deduction)': 'Fees withheld by a marketplace, payment processor, or bank.',
  'platform / processing fee': 'Fees withheld by a marketplace, payment processor, or bank.',
  'deposit to account': 'The account that received this income or invoice payment.',
  'client (optional)': 'Link this income to a client, or leave it unassigned for direct income.',
  'invoice number': 'A unique reference shown on the invoice and used to track payment.',
  client: 'Choose the client this project or invoice is associated with.',
  'due date': 'The date you expect the invoice to be paid.',
  'itemized line items': 'The work or products billed, with a quantity and price for each.',
  'line items': 'The work or products billed, with a quantity and price for each.',
  'discount amount': 'A flat amount to subtract from the invoice total.',
  'tax rate (%)': 'The percentage tax rate to apply to the invoice.',
  'payment instructions': 'Bank, transfer, or other directions the client needs to pay you.',
  'payment received': 'The amount the client actually paid toward this invoice.',
  'platform / fee deducted': 'The fee withheld from the payment before it reached your account.',
  'payment date': 'The date you received or made this payment.',
  'project name': 'A name that identifies the client engagement or piece of work.',
  'agreed value': 'The total amount agreed for the project before payments or expenses.',
  status: 'The project\'s current state, such as in progress, on hold, or complete.',
  'goal name': 'A name that helps you identify what you are saving for.',
  'target amount': 'The total amount you want to save for this goal.',
  'target date (optional)': 'The date you hope to reach this savings target; it can be left blank.',
  'contribution amount ($)': 'The amount you are adding to this savings goal now.',
  'deduct from account': 'Choose an account to reduce by this contribution, or leave it unchanged.',
  'full legal / business name': 'The name used on your profile and business documents.',
  'full name': 'The name shown on your account profile.',
  'billing & notice email': 'The contact email shown for billing and business notices.',
  'base currency': 'The default currency for totals, reports, and financial settings.',
  'country of tax residence': 'The country where you are generally considered tax resident.',
  'target tax reserve percentage (%)': 'The share of taxable profit you want to set aside as a planning reserve.',
  'fiscal year start month': 'The month your reporting year begins.',
  'payment amount ($)': 'The amount paid toward estimated taxes.',
  'tax year': 'The tax year this payment should be associated with.',
  'memo / notes': 'Optional details such as the quarter, authority, or payment reference.',
  'subscription name': 'The name of the recurring service or plan you pay for.',
  'vendor / provider': 'The company that bills you for this subscription.',
  'billing amount': 'The amount charged each billing cycle.',
  frequency: 'How often the vendor charges this subscription.',
  'next payment date': 'The next date this subscription is expected to be charged.',
  'transaction type': 'Choose whether money came in, went out, or moved between your accounts.',
  amount: 'The amount of money involved in this transaction.',
  'source account (outflow)': 'The account the transferred money will leave.',
  'destination account (inflow)': 'The account the transferred money will enter.',
  'destination account (deposit to)': 'The account that received this income.',
  'payment account (paid from)': 'The account that paid this expense.',
  'item description': 'What work or product this invoice line is charging for.',
  'line item description': 'What work or product this invoice line is charging for.',
  qty: 'The number of units or hours billed on this line.',
  quantity: 'The number of units or hours billed on this line.',
  rate: 'The price charged for one unit or hour on this line.',
  'unit rate': 'The price charged for one unit or hour on this line.',
};

function textFromNode(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join(' ');
  if (!isValidElement(node)) return '';
  if (node.type === 'input' || node.type === 'svg') return '';
  return textFromNode(node.props?.children);
}

function normalizeLabel(label) {
  return label.replace(/\*/g, '').replace(/\s+/g, ' ').replace(/[:\uFF1A]$/, '').trim().toLowerCase();
}

function describeField(label) {
  const key = normalizeLabel(label);
  if (fieldDescriptions[key]) return fieldDescriptions[key];
  if (key.includes('currency')) return 'Choose the currency used to record this amount.';
  if (key.includes('date')) return 'Choose the date this record applies to.';
  if (/amount|balance|value|fee|rate|percentage|tax/.test(key)) return 'Enter the money value or rate used for this record.';
  if (key.includes('account')) return 'Choose the financial account related to this record.';
  if (key.includes('client')) return 'Choose the client associated with this work.';
  if (key.includes('category')) return 'Choose a category so this entry is grouped correctly in reports.';
  if (key.includes('status')) return 'Choose the current state of this record.';
  if (key.includes('name')) return 'Enter a clear name you will recognize later.';
  if (key.includes('description') || key.includes('notes') || key.includes('memo')) return 'Add details that will help explain this record later.';
  if (key.includes('email')) return 'Enter an email address used for contact or account access.';
  return `Enter or choose the ${label.toLowerCase()} to save with this record.`;
}

export function FieldHint({ label, description = describeField(label), compact = false }) {
  const id = useId();
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(256, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const showAbove = rect.top > 128 || window.innerHeight - rect.bottom < 100;
    setPosition({ left, top: showAbove ? rect.top - 8 : rect.bottom + 8, width, showAbove });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const closeOutside = (event) => {
      if (!buttonRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`What does ${label} mean?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!open) updatePosition();
          setOpen((value) => !value);
        }}
        className={`inline-flex ${compact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
      >
        <Info className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      </button>
      {open && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          style={{
            position: 'fixed',
            left: position.left,
            top: position.top,
            width: position.width,
            transform: position.showAbove ? 'translateY(-100%)' : undefined,
          }}
          className="z-[100] rounded-xl border border-slate-700 bg-[#0f172a] px-3.5 py-3 text-left text-[11px] leading-5 text-white shadow-xl"
        >
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-blue-200">{label}</span>
          {description}
        </div>,
        document.body
      )}
    </>
  );
}

function enhanceNode(node, path = 'field') {
  if (!isValidElement(node)) return node;

  if (node.type === 'label') {
    const label = textFromNode(node.props.children).replace(/\s+/g, ' ').trim();
    if (!label) return node;
    const className = node.props.className || '';
    const marginClass = className.match(/(?:^|\s)(mb-[^\s]+)/)?.[1] || '';
    const labelClassName = className.replace(/(?:^|\s)mb-[^\s]+/g, ' ').trim();
    const wrappedLabel = cloneElement(node, { className: labelClassName }, node.props.children);
    return (
      <div key={node.key ?? path} className={`flex items-center gap-1.5 ${marginClass}`}>
        {wrappedLabel}
        <FieldHint label={label} description={describeField(label)} />
      </div>
    );
  }

  if (node.props?.children === undefined) return node;
  return cloneElement(node, {}, Children.map(node.props.children, (child, index) => enhanceNode(child, `${path}-${index}`)));
}

export function FieldHints({ children }) {
  return <>{Children.map(children, (child, index) => enhanceNode(child, `field-${index}`))}</>;
}
