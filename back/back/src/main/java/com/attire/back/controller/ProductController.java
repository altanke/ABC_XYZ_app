package com.attire.back.controller;

import com.attire.back.dto.ProductDto;
import com.attire.back.model.Product;
import com.attire.back.service.ProductService;
import com.attire.back.service.CurrencyService; // Импортируем CurrencyService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
// Импортируем классы для создания JSON-ответа
import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CurrencyService currencyService; // Инжектируем CurrencyService


    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        List<ProductDto> productDtos = products.stream()
                .map(product -> new ProductDto(
                        product.getId(),
                        product.getName(),
                        product.getPrice(),
                        product.getDescription(),
                        product.getCategory(),
                        product.getImageUrl()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.findById(id);
        return product.map(p -> ResponseEntity.ok(new ProductDto(
                p.getId(),
                p.getName(),
                p.getPrice(),
                p.getDescription(),
                p.getCategory(),
                p.getImageUrl()
        ))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.ok(savedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Optional<Product> existingProduct = productService.findById(id);
        if (existingProduct.isPresent()) {
            Product product = existingProduct.get();
            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setPrice(productDetails.getPrice());
            product.setImageUrl(productDetails.getImageUrl());
            product.setCategory(productDetails.getCategory());
            Product updatedProduct = productService.saveProduct(product);
            return ResponseEntity.ok(updatedProduct);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productService.findById(id).isPresent()) {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // НОВЫЙ ЭНДПОИНТ для получения конвертированной цены продукта
    @GetMapping("/{id}/price/in/{currency}")
    public ResponseEntity<?> getConvertedProductPrice(
            @PathVariable Long id,
            @PathVariable String currency) {

        // 1. Находим продукт по ID
        Optional<Product> productOptional = productService.findById(id);
        if (productOptional.isEmpty()) {
            return ResponseEntity.notFound().build(); // Если продукт не найден
        }

        Product product = productOptional.get();
        String baseCurrency = "USD"; // Базовая валюта ваших продуктов (измените, если другая)

        try {
            // 2. Получаем курс обмена через CurrencyService
            double exchangeRate = currencyService.getExchangeRate(baseCurrency, currency.toUpperCase());

            // 3. Рассчитываем конвертированную цену
            double convertedPrice = product.getPrice() * exchangeRate;

            // 4. Возвращаем ответ в виде простого JSON объекта
            Map<String, Object> response = new HashMap<>();
            response.put("convertedPrice", convertedPrice);
            response.put("currency", currency.toUpperCase()); // Возвращаем код валюты для фронтенда

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            // Обработка ошибок при получении курса (например, неверный код валюты, проблема с API)
            // Логируем ошибку на стороне сервера
            System.err.println("Ошибка при получении конвертированной цены: " + e.getMessage());
            // Возвращаем ошибку фронтенду
            return ResponseEntity.status(500).body("Ошибка при получении курса обмена: " + e.getMessage());
        }
    }
}