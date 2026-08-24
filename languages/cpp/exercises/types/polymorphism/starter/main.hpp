// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#pragma once

#include <memory>
#include <string>
#include <vector>

/** Provided, so nobody has to argue about how many digits of it to type. */
constexpr double kPi = 3.14159265358979323846;

/** A shape that knows its own area and can say what it is. */
class Shape {
  public:
    virtual ~Shape();

    virtual double area() const = 0;
    virtual std::string name() const = 0;

    /** Not pure: every shape gets this unless it has something better to say. */
    virtual std::string describe() const;
};

class Rectangle : public Shape {
  public:
    Rectangle(double width, double height);

    double area() const override;
    std::string name() const override;

  private:
    double width_;
    double height_;
};

/** A rectangle with a constraint, and an opinion about how it is described. */
class Square : public Rectangle {
  public:
    explicit Square(double side);

    std::string name() const override;
    std::string describe() const override;
};

class Circle : public Shape {
  public:
    explicit Circle(double radius);
    ~Circle() override;

    double area() const override;
    std::string name() const override;

    /** How many circles have been destroyed since the last reset. */
    static int destroyed();
    static void reset_destroyed();

  private:
    double radius_;
};

/** The areas of every shape, added up. */
double total_area(const std::vector<std::unique_ptr<Shape>> &shapes);

/** The largest shape, or nullptr if there are none. Ties go to the first. */
const Shape *largest(const std::vector<std::unique_ptr<Shape>> &shapes);

/** How many of these are circles, whatever the static type says. */
int count_circles(const std::vector<std::unique_ptr<Shape>> &shapes);
