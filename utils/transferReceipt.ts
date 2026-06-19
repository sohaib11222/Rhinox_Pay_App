/**
 * Maps transfer API/receipt data for TransactionReceiptModal.
 */

export function isRhinoxPayUserTransfer(details?: {
  channel?: string | null;
  paymentMethod?: string | null;
}): boolean {
  const channel = details?.channel?.toLowerCase() || '';
  const method = details?.paymentMethod?.toLowerCase() || '';
  return (
    channel === 'rhionx_user' ||
    channel === 'rhinox_user' ||
    method === 'rhionx_user' ||
    method === 'rhinox_user' ||
    method.includes('rhionx') ||
    method.includes('rhinox pay id') ||
    method.includes('rhinoxpay')
  );
}

export function formatReceiptCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  const upper = country.toUpperCase();
  if (upper === 'NG') return 'Nigeria';
  return country;
}

function parseReceiptNumericAmount(value?: string | number | null): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function formatReceiptAmount(value: string | number | undefined, currency = 'NGN'): string {
  const num = parseReceiptNumericAmount(value);
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatReceiptDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface TransferReceiptFallback {
  amount?: string;
  currency?: string;
  country?: string;
  recipientName?: string;
  rhinoxPayId?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paymentMethod?: string;
}

const resolveReceiptPaymentMethod = (details: any, channel?: string | null): string => {
  if (isRhinoxPayUserTransfer({ channel, paymentMethod: details?.paymentMethod })) {
    return 'RhinoxPay Transfer';
  }

  const channelLower = channel?.toLowerCase() || '';
  if (channelLower === 'bank_account') return 'Bank Transfer';
  if (channelLower === 'mobile_money') return 'Mobile Money';

  const method = details?.paymentMethod?.toLowerCase() || '';
  if (
    method &&
    !['failed', 'pending', 'processing', 'completed', 'successful', 'success'].includes(method)
  ) {
    return details.paymentMethod;
  }

  return 'Bank Transfer';
};

export function resolveReceiptChannel(details?: any): string | undefined {
  const channel = details?.channel || details?.metadata?.transferType;
  if (channel) return channel;
  const method = details?.paymentMethod?.toLowerCase() || '';
  if (method === 'rhionx_user' || method === 'rhinox_user') return method;
  return undefined;
}

export function isCreditReference(reference?: string | null): boolean {
  return String(reference || '').toUpperCase().endsWith('-CREDIT');
}

export function isRhinoxIncomingTransfer(details?: any): boolean {
  if (!details) return false;
  const metadata = details.metadata || {};
  const channel = resolveReceiptChannel(details);
  const type = String(details.type || '').toLowerCase();
  const reference = String(details.reference || details.transactionId || '').toUpperCase();
  const hasSender = Boolean(metadata.senderUserId || metadata.senderInfo || details.senderInfo);
  const isRhinox = isRhinoxPayUserTransfer({ channel, paymentMethod: details.paymentMethod });

  if (!isRhinox) return false;
  if (type === 'deposit' || hasSender || isCreditReference(reference)) return true;
  if (parseSenderNameFromDescription(details.description || details.transactionTitle)) return true;
  return false;
}

export function resolveSenderInfo(details?: any) {
  const metadata = details?.metadata || {};
  const senderInfo = details?.senderInfo || metadata.senderInfo || {};
  const description = details?.description || '';
  const fromMatch = description.match(/\bfrom\s+(.+)$/i);

  return {
    name: senderInfo.name || details?.senderName || (fromMatch ? fromMatch[1].trim() : undefined),
    rhinoxPayId: senderInfo.rhinoxPayId || metadata.senderRhinoxPayId,
    email: senderInfo.email,
    phone: senderInfo.phone,
  };
}

export function mapTransactionReceiptTransaction(
  details: any,
  fallback: TransferReceiptFallback = {},
  options: { transactionType?: 'send' | 'withdrawal' | 'fund' | 'deposit' } = {}
) {
  if (isRhinoxIncomingTransfer(details)) {
    const sender = resolveSenderInfo(details);
    const currency = details?.currency || fallback.currency || 'NGN';

    return {
      transactionType: options.transactionType || 'fund',
      transferDirection: 'incoming' as const,
      transactionTitle: `RhinoxPay Received${sender.name ? ` - ${sender.name}` : ''}`,
      transferAmount: formatReceiptAmount(details?.amount ?? fallback.amount, currency),
      fee: formatReceiptAmount(details?.fee ?? '0', currency),
      paymentAmount: formatReceiptAmount(
        details?.creditedAmount ?? details?.totalAmount ?? details?.amount ?? fallback.amount,
        currency
      ),
      recipientName: sender.name || fallback.recipientName,
      senderName: sender.name,
      accountName: sender.name || fallback.accountName,
      bank: 'RhinoxPay Wallet',
      accountNumber: sender.rhinoxPayId || fallback.rhinoxPayId,
      rhinoxPayId: sender.rhinoxPayId || fallback.rhinoxPayId,
      transactionId: details?.reference || (details?.id ? String(details.id) : undefined),
      paymentMethod: 'RhinoxPay Transfer',
      status: details?.status,
      dateTime: formatReceiptDate(
        details?.date || details?.completedAt || details?.createdAt
      ),
      channel: details?.channel || 'rhionx_user',
    };
  }

  const outgoing = mapTransferReceiptTransaction(details, fallback, {
    transactionType: options.transactionType === 'withdrawal' ? 'withdrawal' : 'send',
  });
  return {
    ...outgoing,
    transferDirection: 'outgoing' as const,
  };
}

export function isRhinoxPayIncomingTransfer(details?: {
  channel?: string | null;
  type?: string | null;
  metadata?: any;
  senderInfo?: any;
}): boolean {
  const channel = details?.channel?.toLowerCase() || '';
  const transferType = details?.metadata?.transferType?.toLowerCase() || '';
  return (
    channel === 'rhionx_user' ||
    channel === 'rhinox_user' ||
    transferType === 'rhionx_user' ||
    transferType === 'rhinox_user' ||
    !!details?.metadata?.senderUserId ||
    !!details?.metadata?.senderInfo ||
    !!details?.senderInfo
  );
}

export function parseSenderNameFromDescription(description?: string | null): string | undefined {
  if (!description) return undefined;
  const match = description.match(/\bfrom\s+(.+)$/i);
  return match?.[1]?.trim();
}

export function mapReceiveReceiptTransaction(
  details: any,
  fallback: TransferReceiptFallback = {}
) {
  const metadata = details?.metadata || {};
  const senderInfo = {
    ...(metadata.senderInfo || {}),
    ...(details?.senderInfo || {}),
  };
  const channel = details?.channel || metadata.transferType;
  const isRhinoxPay = isRhinoxPayIncomingTransfer({
    channel,
    type: details?.type,
    metadata,
    senderInfo: details?.senderInfo,
  });

  const currency = details?.currency || fallback.currency || 'NGN';
  const senderName =
    senderInfo.name ||
    senderInfo.accountName ||
    fallback.recipientName ||
    parseSenderNameFromDescription(details?.description);
  const rhinoxPayId =
    senderInfo.rhinoxPayId ||
    details?.rhinoxPayId ||
    fallback.rhinoxPayId;

  return {
    transactionType: 'fund' as const,
    transactionTitle: isRhinoxPay
      ? `RhinoxPay Transfer${senderName ? ` - ${senderName}` : ''}`
      : details?.description || details?.normalizedType || 'Fund Wallet',
    transferAmount: formatReceiptAmount(
      details?.amount ?? details?.creditedAmount ?? fallback.amount,
      currency
    ),
    fee: formatReceiptAmount(details?.fee ?? '0', currency),
    paymentAmount: formatReceiptAmount(
      details?.creditedAmount ?? details?.totalAmount ?? details?.amount ?? fallback.amount,
      currency
    ),
    senderName,
    recipientName: senderName,
    accountName: senderName,
    rhinoxPayId: isRhinoxPay ? rhinoxPayId : undefined,
    accountNumber: isRhinoxPay ? rhinoxPayId : metadata.accountNumber || details?.accountNumber,
    bank: isRhinoxPay
      ? 'RhinoxPay Wallet'
      : metadata.bankName ||
        details?.bankAccount?.bankName ||
        details?.virtualAccount?.bankName ||
        fallback.bankName,
    channel,
    paymentMethod: isRhinoxPay
      ? 'RhinoxPay Transfer'
      : fallback.paymentMethod || resolveReceiptPaymentMethod(details, channel),
    fundingRoute: isRhinoxPay ? 'RhinoxPay Transfer' : undefined,
    provider: isRhinoxPay ? 'RhinoxPay Transfer' : details?.provider?.name,
    country: isRhinoxPay
      ? undefined
      : formatReceiptCountry(details?.country || fallback.country),
    transactionId: details?.reference || (details?.id ? String(details.id) : undefined),
    status: details?.status,
    dateTime: formatReceiptDate(
      details?.date || details?.completedAt || details?.createdAt
    ),
    isIncomingRhinoxPay: isRhinoxPay,
  };
}

/**
 * Normalizes partial UI transaction objects so Rhinox send/receive receipts
 * always show wallet + Pay ID fields instead of empty bank columns.
 */
export function enrichReceiptTransaction(transaction: any) {
  if (!transaction) return transaction;

  const channel = resolveReceiptChannel(transaction);
  const reference = transaction.transactionId || transaction.reference || '';
  const description = transaction.transactionTitle || transaction.description || '';
  const receivedFrom = parseSenderNameFromDescription(description);
  const sentToMatch = description.match(/\bto\s+(.+)$/i);
  const sentToName = sentToMatch?.[1]?.trim();

  const isIncoming =
    transaction.transferDirection === 'incoming' ||
    transaction.isIncomingRhinoxPay ||
    isRhinoxIncomingTransfer({
      ...transaction,
      channel,
      reference,
      description,
    });

  const isOutgoingRhinox =
    !isIncoming && isRhinoxPayUserTransfer({ channel, paymentMethod: transaction.paymentMethod });

  if (!isIncoming && !isOutgoingRhinox) {
    return transaction;
  }

  const enriched = {
    ...transaction,
    channel: channel || 'rhionx_user',
    paymentMethod: 'RhinoxPay Transfer',
    bank: 'RhinoxPay Wallet',
  };

  if (isIncoming) {
    const senderName =
      enriched.senderName || receivedFrom || enriched.accountName || enriched.recipientName;
    const payId = enriched.rhinoxPayId || enriched.accountNumber;

    return {
      ...enriched,
      transferDirection: 'incoming' as const,
      transactionType:
        enriched.transactionType === 'send' ? 'fund' : enriched.transactionType || 'fund',
      senderName,
      recipientName: senderName,
      accountName: senderName,
      rhinoxPayId: payId,
      accountNumber: payId,
    };
  }

  const recipientName =
    enriched.recipientName || sentToName || enriched.accountName || enriched.senderName;
  const payId = enriched.rhinoxPayId || enriched.accountNumber;

  return {
    ...enriched,
    transferDirection: 'outgoing' as const,
    transactionType:
      enriched.transactionType === 'fund' ? 'send' : enriched.transactionType || 'send',
    recipientName,
    accountName: recipientName,
    rhinoxPayId: payId,
    accountNumber: payId,
  };
}

export function mapReceiptFromApiDetails(
  details: any,
  fallback: TransferReceiptFallback = {},
  options: { transactionType?: 'send' | 'withdrawal' | 'fund' | 'deposit' } = {}
) {
  if (isRhinoxIncomingTransfer(details)) {
    return {
      ...mapReceiveReceiptTransaction(details, fallback),
      transferDirection: 'incoming' as const,
    };
  }
  return mapTransactionReceiptTransaction(details, fallback, options);
}

export function buildEnrichedReceiptFromDetails(
  details: any,
  fallback: TransferReceiptFallback = {},
  options: { transactionType?: 'send' | 'withdrawal' | 'fund' | 'deposit' } = {}
) {
  return enrichReceiptTransaction(
    mapReceiptFromApiDetails(
      details,
      {
        amount: details?.amount,
        currency: details?.currency,
        ...fallback,
      },
      options
    )
  );
}

export function buildEnrichedReceiptFromListItem(
  rawData: any,
  ui: {
    title?: string;
    dateTime?: string;
    status?: string;
    listAmount?: string;
  } = {}
) {
  const mapped = buildEnrichedReceiptFromDetails(rawData, {
    amount: rawData?.amount,
    currency: rawData?.currency,
    recipientName:
      rawData?.senderInfo?.name ||
      rawData?.recipientInfo?.name ||
      rawData?.recipientInfo?.accountName,
    rhinoxPayId:
      rawData?.senderInfo?.rhinoxPayId ||
      rawData?.recipientInfo?.rhinoxPayId ||
      rawData?.metadata?.recipientRhinoxPayId,
    country: rawData?.country,
  });

  return enrichReceiptTransaction({
    ...mapped,
    transactionTitle: ui.title || mapped.transactionTitle,
    dateTime: ui.dateTime || mapped.dateTime,
    status: ui.status || mapped.status,
    transferAmount: mapped.transferAmount || ui.listAmount,
    amountNGN: mapped.transferAmount || ui.listAmount,
    paymentAmount: mapped.paymentAmount || mapped.transferAmount || ui.listAmount,
  });
}

export function mapTransferReceiptTransaction(
  details: any,
  fallback: TransferReceiptFallback = {},
  options: { transactionType?: 'send' | 'withdrawal' } = {}
) {
  const metadata = details?.metadata || {};
  const recipientInfo = {
    ...(metadata.recipientInfo || {}),
    ...(details?.recipientInfo || {}),
  };
  const channel = details?.channel || metadata.transferType;
  const isRhinoxPay = isRhinoxPayUserTransfer({
    channel,
    paymentMethod: details?.paymentMethod,
  });

  const currency = details?.currency || fallback.currency || 'NGN';
  const rhinoxPayId =
    recipientInfo.rhinoxPayId ||
    details?.rhinoxPayId ||
    metadata.recipientRhinoxPayId ||
    fallback.rhinoxPayId;

  const recipientName =
    recipientInfo.name ||
    recipientInfo.accountName ||
    details?.accountName ||
    fallback.recipientName ||
    fallback.accountName;

  const bankName =
    metadata.bankName ||
    recipientInfo.bankName ||
    details?.bankName ||
    fallback.bankName;
  const accountNumber =
    metadata.accountNumber ||
    recipientInfo.accountNumber ||
    details?.accountNumber ||
    fallback.accountNumber;
  const accountName = isRhinoxPay
    ? recipientName
    : metadata.accountName ||
      recipientInfo.accountName ||
      details?.accountName ||
      fallback.accountName ||
      recipientName;

  const transactionType = options.transactionType || 'send';

  return {
    transactionType,
    transactionTitle:
      transactionType === 'withdrawal'
        ? `Withdrawal${accountName ? ` - ${accountName}` : ''}`
        : isRhinoxPay
        ? `RhinoxPay Transfer${recipientName ? ` - ${recipientName}` : ''}`
        : `Send Funds${recipientName ? ` - ${recipientName}` : ''}`,
    transferAmount: formatReceiptAmount(details?.amount ?? fallback.amount, currency),
    fee: formatReceiptAmount(details?.fee ?? '0', currency),
    paymentAmount: formatReceiptAmount(
      details?.totalAmount ?? details?.amount ?? fallback.amount,
      currency
    ),
    country: formatReceiptCountry(details?.country || fallback.country),
    recipientName,
    accountName,
    bank: isRhinoxPay ? 'RhinoxPay Wallet' : bankName,
    accountNumber: isRhinoxPay ? rhinoxPayId : accountNumber,
    rhinoxPayId: isRhinoxPay ? rhinoxPayId : undefined,
    transactionId: details?.reference || (details?.id ? String(details.id) : undefined),
    paymentMethod:
      fallback.paymentMethod ||
      resolveReceiptPaymentMethod(details, channel),
    status: details?.status,
    dateTime: formatReceiptDate(
      details?.date || details?.completedAt || details?.createdAt
    ),
    channel,
    transferDirection: 'outgoing' as const,
  };
}
