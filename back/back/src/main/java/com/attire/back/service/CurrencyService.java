package com.attire.back.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;

@Service
public class CurrencyService {

    @Value("${currency.api.key}")
    private String apiKey;

    @Value("${currency.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private Map<String, Double> rateCache = new HashMap<>();
    private long lastFetchTime = 0;
    private static final long CACHE_TTL = 1000 * 60 * 30;


    public double getExchangeRate(String base, String target) {
        String cacheKey = base.toUpperCase() + "_" + target.toUpperCase();

        if (rateCache.containsKey(cacheKey) && (System.currentTimeMillis() - lastFetchTime < CACHE_TTL)) {
            System.out.println("Используем кешированный курс для " + cacheKey);
            return rateCache.get(cacheKey);
        }

        System.out.println("Запрашиваем новый курс для " + cacheKey);

        String url = apiUrl + apiKey + "/latest/" + base.toUpperCase();

        try {
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = response.getBody();
                JsonNode rates = root.get("conversion_rates");

                if (rates != null && rates.has(target.toUpperCase())) {
                    double rate = rates.get(target.toUpperCase()).asDouble();
                    rateCache.put(cacheKey, rate);
                    lastFetchTime = System.currentTimeMillis();
                    return rate;
                } else {
                    throw new RuntimeException("Целевая валюта '" + target + "' не найдена в ответе API.");
                }
            } else {
                throw new RuntimeException("Не удалось получить курсы обмена от API. Код статуса: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Ошибка во время вызова API для получения курса обмена: " + e.getMessage());
        }
    }
}