package com.attire.back.controller;

import com.attire.back.dto.ProductDto;
import com.attire.back.model.Product;
import com.attire.back.service.ProductService;
import com.attire.back.service.CurrencyService;
import com.attire.back.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CurrencyService currencyService;

    @Autowired
    private FileStorageService fileStorageService;

    private ProductDto convertToDto(Product product) {
        String imageUrl = null;
        if (product.getImageFileName() != null && !product.getImageFileName().isBlank()) {
            imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/images/")
                    .path(product.getImageFileName())
                    .toUriString();
        }
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getDescription(),
                product.getCategory(),
                imageUrl
        );
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        List<ProductDto> productDtos = products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(productDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.findById(id);
        return product.map(p -> ResponseEntity.ok(convertToDto(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDto> createProduct(
            @RequestPart("product") Product product,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = fileStorageService.storeFile(imageFile);
                product.setImageFileName(fileName);
            } else {
                product.setImageFileName(null);
            }
            // Устанавливаем, что новый товар по умолчанию активен
            product.setActive(true);
            Product savedProduct = productService.saveProduct(product);
            return ResponseEntity.ok(convertToDto(savedProduct));
        } catch (Exception e) {
            System.err.println("Error creating product: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") Product productDetails,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {

        Optional<Product> existingProductOptional = productService.findProductByIdForAdmin(id);


        if (existingProductOptional.isPresent()) {
            Product product = existingProductOptional.get();
            String oldFileName = product.getImageFileName();

            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setPrice(productDetails.getPrice());
            product.setCategory(productDetails.getCategory());


            try {
                if (imageFile != null && !imageFile.isEmpty()) {
                    String newFileName = fileStorageService.storeFile(imageFile);
                    product.setImageFileName(newFileName);
                    if (oldFileName != null && !oldFileName.equals(newFileName)) {
                        fileStorageService.deleteFile(oldFileName);
                    }
                }

                Product updatedProduct = productService.saveProduct(product);
                return ResponseEntity.ok(convertToDto(updatedProduct));
            } catch (Exception e) {
                System.err.println("Error updating product: " + e.getMessage());
                return ResponseEntity.internalServerError().build();
            }

        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        Optional<Product> productOptional = productService.findProductByIdForAdmin(id);

        if (productOptional.isPresent()) {
            Product product = productOptional.get();
            String fileName = product.getImageFileName();

            productService.deleteProduct(id);


            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/price/in/{currency}")
    public ResponseEntity<?> getConvertedProductPrice(
            @PathVariable Long id,
            @PathVariable String currency) {

        Optional<Product> productOptional = productService.findById(id);
        if (productOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOptional.get();
        String baseCurrency = "USD";

        try {
            double exchangeRate = currencyService.getExchangeRate(baseCurrency, currency.toUpperCase());
            double convertedPrice = product.getPrice() * exchangeRate;
            Map<String, Object> response = new HashMap<>();
            response.put("convertedPrice", convertedPrice);
            response.put("currency", currency.toUpperCase());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Ошибка при получении конвертированной цены: " + e.getMessage());
            return ResponseEntity.status(500).body("Ошибка при получении курса обмена: " + e.getMessage());
        }
    }
}