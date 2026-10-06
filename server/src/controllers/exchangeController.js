import {
  acceptExchangeProposal,
  cancelExchangeProposal,
  createExchangeProposal,
  getVisibleExchange,
  listReceivedExchangeProposals,
  listSentExchangeProposals,
  rejectExchangeProposal
} from '../services/exchangeService.js';

export function createExchange(req, res, next) {
  try {
    const exchange = createExchangeProposal(req.user.id, req.body);
    res.status(201).json({ exchange });
  } catch (err) {
    next(err);
  }
}

export function listSentExchanges(req, res, next) {
  try {
    res.status(200).json({ exchanges: listSentExchangeProposals(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export function listReceivedExchanges(req, res, next) {
  try {
    res.status(200).json({ exchanges: listReceivedExchangeProposals(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export function getExchange(req, res, next) {
  try {
    res.status(200).json({ exchange: getVisibleExchange(req.user.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export function acceptExchange(req, res, next) {
  try {
    res.status(200).json({ exchange: acceptExchangeProposal(req.user.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export function rejectExchange(req, res, next) {
  try {
    res.status(200).json({ exchange: rejectExchangeProposal(req.user.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export function cancelExchange(req, res, next) {
  try {
    res.status(200).json({ exchange: cancelExchangeProposal(req.user.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}
