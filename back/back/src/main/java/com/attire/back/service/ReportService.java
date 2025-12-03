package com.attire.back.service;

import com.attire.back.dto.AbcXyzReportDto;
import com.attire.back.dto.ProductDto;
import com.attire.back.model.Order;
import com.attire.back.model.OrderItem;
import com.attire.back.model.Product;
import com.attire.back.repository.OrderRepository;
import com.attire.back.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime; // Импортируем LocalTime
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    private ProductDto convertToDto(Product product) {
        String imageUrl = null;
        String imageFileName = product.getImageFileName();

        if (imageFileName != null && !imageFileName.isBlank()) {
            if (imageFileName.startsWith("http://") || imageFileName.startsWith("https://")) {
                imageUrl = imageFileName;
            } else {
                imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                        .path("/api/files/images/")
                        .path(imageFileName)
                        .toUriString();
            }
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

    @Transactional(readOnly = true)
    public List<AbcXyzReportDto> getAbcXyzAnalysis(int months) {

        Map<Long, AbcXyzReportDto> reportMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(
                        Product::getId,
                        product -> new AbcXyzReportDto(convertToDto(product))
                ));

        // --- ИСПРАВЛЕНИЕ ЛОГИКИ ДАТ ---
        // 1. Конец периода = конец *прошлого* месяца (чтобы не считать текущий неполный месяц)
        LocalDateTime endDate = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN).minusNanos(1);

        // 2. Начало периода = 1-е число, 00:00, (N-1) месяцев назад от endDate
        LocalDateTime startDate = endDate.minusMonths(months - 1).withDayOfMonth(1).with(LocalTime.MIN);
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        List<Order> allOrders = orderRepository.findAll().stream()
                .filter(order -> !order.getOrderDate().isBefore(startDate) && !order.getOrderDate().isAfter(endDate))
                .collect(Collectors.toList());

        List<OrderItem> allOrderItems = allOrders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .collect(Collectors.toList());

        calculateAbcAnalysis(reportMap, allOrderItems);
        calculateXyzAnalysis(reportMap, allOrders, allOrderItems, startDate, endDate);

        reportMap.values().forEach(report ->
                report.setCombinedClass(report.getAbcClass() + report.getXyzClass())
        );

        return reportMap.values().stream()
                .sorted(Comparator.comparing(AbcXyzReportDto::getTotalRevenue).reversed())
                .collect(Collectors.toList());
    }

    private void calculateAbcAnalysis(Map<Long, AbcXyzReportDto> reportMap, List<OrderItem> allOrderItems) {
        if (allOrderItems.isEmpty()) {
            return;
        }

        Map<Long, BigDecimal> productRevenueMap = allOrderItems.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getId(),
                        Collectors.mapping(
                                item -> item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())),
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        productRevenueMap.forEach((productId, revenue) -> {
            if (reportMap.containsKey(productId)) {
                reportMap.get(productId).setTotalRevenue(revenue);
            }
        });

        BigDecimal totalRevenueOverall = productRevenueMap.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalRevenueOverall.compareTo(BigDecimal.ZERO) == 0) return;

        List<AbcXyzReportDto> sortedReports = reportMap.values().stream()
                .sorted(Comparator.comparing(AbcXyzReportDto::getTotalRevenue).reversed())
                .collect(Collectors.toList());

        BigDecimal cumulativeRevenue = BigDecimal.ZERO;
        double cumulativePercentage = 0.0;

        for (AbcXyzReportDto report : sortedReports) {
            BigDecimal revenue = report.getTotalRevenue();
            if (revenue.compareTo(BigDecimal.ZERO) > 0) {
                double share = revenue.divide(totalRevenueOverall, 4, RoundingMode.HALF_UP).doubleValue() * 100;
                report.setRevenueSharePercentage(share);

                cumulativeRevenue = cumulativeRevenue.add(revenue);
                cumulativePercentage = cumulativeRevenue.divide(totalRevenueOverall, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            }

            if (cumulativePercentage <= 80.0) {
                report.setAbcClass("A");
            } else if (cumulativePercentage <= 95.0) {
                report.setAbcClass("B");
            } else {
                report.setAbcClass("C");
            }
        }
    }

    private void calculateXyzAnalysis(Map<Long, AbcXyzReportDto> reportMap, List<Order> allOrders, List<OrderItem> allOrderItems, LocalDateTime minDateLdt, LocalDateTime maxDateLdt) {

        reportMap.values().forEach(report -> report.setXyzClass("Z"));

        if (allOrders.isEmpty() || allOrderItems.isEmpty()) {
            return;
        }

        long totalMonths = ChronoUnit.MONTHS.between(YearMonth.from(minDateLdt), YearMonth.from(maxDateLdt)) + 1;

        if (totalMonths < 2) {
            return;
        }

        Map<Long, Map<YearMonth, Integer>> salesByProductMonth = allOrderItems.stream()
                .collect(Collectors.groupingBy(
                        item -> item.getProduct().getId(),
                        Collectors.groupingBy(
                                item -> YearMonth.from(item.getOrder().getOrderDate()),
                                Collectors.summingInt(OrderItem::getQuantity)
                        )
                ));

        for (Map.Entry<Long, AbcXyzReportDto> entry : reportMap.entrySet()) {
            Long productId = entry.getKey();
            AbcXyzReportDto report = entry.getValue();

            Map<YearMonth, Integer> monthlySales = salesByProductMonth.get(productId);

            if (monthlySales == null || monthlySales.isEmpty()) {
                report.setCoefficientOfVariation(0.0);
                continue;
            }

            YearMonth currentMonth = YearMonth.from(minDateLdt);
            YearMonth lastMonth = YearMonth.from(maxDateLdt);

            List<Double> salesData = new java.util.ArrayList<>();
            while (!currentMonth.isAfter(lastMonth)) {
                salesData.add((double) monthlySales.getOrDefault(currentMonth, 0));
                currentMonth = currentMonth.plusMonths(1);
            }

            double sum = salesData.stream().mapToDouble(Double::doubleValue).sum();
            double mean = sum / totalMonths;

            if (mean == 0) {
                report.setCoefficientOfVariation(0.0);
                continue;
            }

            double sumOfSquares = salesData.stream()
                    .mapToDouble(val -> Math.pow(val - mean, 2))
                    .sum();
            double stdDeviation = Math.sqrt(sumOfSquares / totalMonths);

            double cv = (mean == 0) ? 0 : stdDeviation / mean;
            report.setCoefficientOfVariation(cv);

            if (cv <= 0.4) {
                report.setXyzClass("X");
            } else if (cv <= 0.8) {
                report.setXyzClass("Y");
            } else {
                report.setXyzClass("Z");
            }
        }
    }
}