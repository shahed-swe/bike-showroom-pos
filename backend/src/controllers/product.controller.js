const productService = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const products = await productService.list(req.query);
  res.json(products);
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json(product);
});

exports.create = asyncHandler(async (req, res) => {
  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
  const product = await productService.create(req.body, imagePath);
  res.status(201).json(product);
});

exports.update = asyncHandler(async (req, res) => {
  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
  const product = await productService.update(req.params.id, req.body, imagePath);
  res.json(product);
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await productService.remove(req.params.id);
  res.json(result);
});
