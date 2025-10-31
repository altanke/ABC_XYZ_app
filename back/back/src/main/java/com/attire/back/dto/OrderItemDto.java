package com.attire.back.dto;

import java.math.BigDecimal;

public class OrderItemDto {
    private Long id;
    private ProductDto product;
    private int quantity;
    private BigDecimal priceAtPurchase;

    public OrderItemDto(Long id, ProductDto product, int quantity, BigDecimal priceAtPurchase) {
        this.id = id;
        this.product = product;
        this.quantity = quantity;
        this.priceAtPurchase = priceAtPurchase;
    }

    public Long getId() {
        return id;
    }

    public ProductDto getProduct() {
        return product;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getPriceAtPurchase() {
        return priceAtPurchase;
    }
}